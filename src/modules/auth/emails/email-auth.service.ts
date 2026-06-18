import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EmailLoginDto } from './dto/email-login.dto';
import { EmailRegisterDto } from './dto/email-register.dto';
import { EmailChangePasswordDto } from './dto/email-change-password.dto';
import { UsersService } from 'src/modules/users/user.service';
import { Role } from 'src/common/decorators/roles.decorator';
import { ErrorMessages } from 'src/common/constants/error-messages';
import { SuccessMessages } from 'src/common/constants/success-messages';
import { ValidationMessages } from 'src/common/constants/validation-messages';

/**
 * Authentication Service (Prisma / PostgreSQL)
 * RESPONSIBILITY: User authentication, token generation
 */
@Injectable()
export class EmailAuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * Register new user — returns access_token for immediate login.
   */
  async register(registerDto: EmailRegisterDto) {
    const user = await this.usersService.create({
      ...registerDto,
      role: Role.USER,
    });

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const access_token = await this.jwtService.signAsync(payload);

    return {
      access_token,
      message: SuccessMessages.REGISTER_SUCCESS,
    };
  }

  /**
   * User login.
   */
  async login(loginDto: EmailLoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException(ErrorMessages.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await this.usersService.verifyPassword(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(ErrorMessages.INVALID_CREDENTIALS);
    }

    if (!user.isActive) {
      throw new UnauthorizedException(ErrorMessages.USER_INACTIVE);
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    await this.usersService.updateLastLogin(user.id);

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      message: SuccessMessages.LOGIN_SUCCESS,
    };
  }

  /**
   * Change user password.
   */
  async changePassword(
    userId: string,
    changePasswordDto: EmailChangePasswordDto,
  ) {
    const profile = await this.usersService.findOne(userId);
    const user = await this.usersService.findByEmail(profile.email);

    if (!user) {
      throw new UnauthorizedException(ErrorMessages.USER_NOT_FOUND);
    }

    const isPasswordValid = await this.usersService.verifyPassword(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException(ValidationMessages.PASSWORD_MISMATCH);
    }

    await this.usersService.updatePassword(userId, changePasswordDto.newPassword);

    return {
      message: SuccessMessages.PASSWORD_CHANGED,
    };
  }

  /**
   * Validate user credentials (for Passport strategies if needed).
   * @returns User object without the password hash.
   */
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (user && (await this.usersService.verifyPassword(password, user.password))) {
      const { password: _password, ...result } = user;
      return result;
    }

    return null;
  }
}
