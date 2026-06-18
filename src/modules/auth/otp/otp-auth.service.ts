import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../database/prisma.service';
import { TwilioService } from './twilio.service';
import { UsersService } from '../../users/user.service';
import { Role } from '../../../common/decorators/roles.decorator';

/**
 * OTP Authentication Service (Prisma / PostgreSQL)
 * PURPOSE: Handle OTP generation, sending, and verification
 * FEATURES: SMS, WhatsApp, Static OTP for dev, Auto-registration
 */
@Injectable()
export class OtpAuthService {
  private readonly logger = new Logger(OtpAuthService.name);
  private readonly isDevelopment: boolean;
  private readonly staticOtp: string;
  private readonly otpLength: number;
  private readonly otpExpiryMinutes: number;
  private readonly maxAttempts: number;
  private readonly resendCooldownSeconds: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly twilioService: TwilioService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.isDevelopment = this.configService.get<boolean>(
      'otp.isDevelopment',
      true,
    );
    this.staticOtp = this.configService.get<string>('otp.staticOtp', '123456');
    this.otpLength = this.configService.get<number>('otp.otpLength', 6);
    this.otpExpiryMinutes = this.configService.get<number>(
      'otp.otpExpiryMinutes',
      10,
    );
    this.maxAttempts = this.configService.get<number>('otp.maxAttempts', 3);
    this.resendCooldownSeconds = this.configService.get<number>(
      'otp.resendCooldownSeconds',
      60,
    );
  }

  /** Generate random OTP (or static in development). */
  private generateOTP(): string {
    if (this.isDevelopment) {
      return this.staticOtp;
    }
    const min = Math.pow(10, this.otpLength - 1);
    const max = Math.pow(10, this.otpLength) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
  }

  /**
   * Send OTP to phone number.
   */
  async sendOTP(phoneNumber: string, provider: 'sms' | 'whatsapp' = 'sms') {
    if (!this.twilioService.isValidPhoneNumber(phoneNumber)) {
      throw new BadRequestException(
        'Invalid phone number format. Use E.164 format (e.g., +911234567890)',
      );
    }

    // Resend cooldown check
    const recentOtp = await this.prisma.otpVerification.findFirst({
      where: {
        phoneNumber,
        createdAt: {
          gte: new Date(Date.now() - this.resendCooldownSeconds * 1000),
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentOtp && !recentOtp.verified) {
      const timeLeft = Math.ceil(
        (this.resendCooldownSeconds * 1000 -
          (Date.now() - recentOtp.createdAt.getTime())) /
          1000,
      );
      throw new BadRequestException(
        `Please wait ${timeLeft} seconds before requesting a new OTP`,
      );
    }

    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + this.otpExpiryMinutes * 60 * 1000);

    await this.prisma.otpVerification.create({
      data: { phoneNumber, otp, provider, expiresAt },
    });

    try {
      if (provider === 'whatsapp') {
        await this.twilioService.sendWhatsApp(phoneNumber, otp);
      } else {
        await this.twilioService.sendSMS(phoneNumber, otp);
      }

      this.logger.log(`OTP sent to ${phoneNumber} via ${provider}`);

      return {
        message: `OTP sent successfully via ${provider}`,
        expiresIn: `${this.otpExpiryMinutes} minutes`,
        ...(this.isDevelopment && { otp }),
      };
    } catch (error) {
      this.logger.error(`Failed to send OTP to ${phoneNumber}:`, error);
      throw new BadRequestException('Failed to send OTP. Please try again.');
    }
  }

  /**
   * Verify OTP and login/register the user.
   */
  async verifyOTP(phoneNumber: string, otp: string) {
    const otpRecord = await this.prisma.otpVerification.findFirst({
      where: { phoneNumber, verified: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    if (otpRecord.attempts >= this.maxAttempts) {
      throw new UnauthorizedException(
        'Maximum OTP verification attempts exceeded. Please request a new OTP.',
      );
    }

    if (otpRecord.otp !== otp) {
      const updated = await this.prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException(
        `Invalid OTP. ${this.maxAttempts - updated.attempts} attempts remaining.`,
      );
    }

    await this.prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { verified: true, verifiedAt: new Date() },
    });

    // Find or auto-register the user
    let user = await this.usersService.findByPhone(phoneNumber);

    if (!user) {
      user = await this.usersService.create({
        name: `User_${phoneNumber.slice(-4)}`,
        email: `${phoneNumber.replace('+', '')}@phone.user`,
        password: Math.random().toString(36).slice(-12),
        phone: phoneNumber,
        role: Role.USER,
      });
      this.logger.log(`New user auto-registered: ${phoneNumber}`);
    }

    await this.usersService.updateLastLogin(user.id);

    const payload = {
      sub: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };

    const access_token = await this.jwtService.signAsync(payload);

    return {
      access_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      message: 'Login successful',
    };
  }

  /** Resend OTP. */
  async resendOTP(phoneNumber: string, provider: 'sms' | 'whatsapp' = 'sms') {
    return this.sendOTP(phoneNumber, provider);
  }
}
