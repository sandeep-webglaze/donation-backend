import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { Public } from '../../../common/decorators/public.decorator';
import { OtpAuthService } from './otp-auth.service';
import { ResendOtpDto, SendOtpDto, VerifyOtpDto } from './dto/otp-auth.dto';

@Controller('auth/otp')
export class OtpAuthController {
  constructor(private readonly otpAuthService: OtpAuthService) {}

  /**
   * Send OTP to phone number
   * POST /api/auth/otp/send
   * Body: { phoneNumber: '+911234567890', provider: 'sms' | 'whatsapp' }
   */
  @Public()
  @Post('send')
  @HttpCode(HttpStatus.OK)
  async sendOTP(@Body() sendOtpDto: SendOtpDto) {
    return this.otpAuthService.sendOTP(
      sendOtpDto.phoneNumber,
      sendOtpDto.provider,
    );
  }

  /**
   * Verify OTP and login/register user
   * POST /api/auth/otp/verify
   * Body: { phoneNumber: '+911234567890', otp: '123456' }
   */
  @Public()
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyOTP(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.otpAuthService.verifyOTP(
      verifyOtpDto.phoneNumber,
      verifyOtpDto.otp,
    );
  }

  /**
   * Resend OTP
   * POST /api/auth/otp/resend
   * Body: { phoneNumber: '+911234567890', provider: 'sms' | 'whatsapp' }
   */
  @Public()
  @Post('resend')
  @HttpCode(HttpStatus.OK)
  async resendOTP(@Body() resendOtpDto: ResendOtpDto) {
    return this.otpAuthService.resendOTP(
      resendOtpDto.phoneNumber,
      resendOtpDto.provider,
    );
  }
}
