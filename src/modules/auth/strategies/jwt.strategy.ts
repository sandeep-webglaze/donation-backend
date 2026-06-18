import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/modules/users/user.service';
import { ErrorMessages } from 'src/common/constants/error-messages';

/**
 * JWT Payload interface
 * USE: Type safety for JWT token data
 */
export interface JwtPayload {
  sub: string; // User ID (JWT standard)
  email: string;
  role: string;
}

/**
 * JWT Strategy for Passport
 * WHEN: Har protected route pe JWT validate hoga
 * USE: Request headers se token extract karke user validate karna
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('jwt.secret'),
    });
  }

  /**
   * Validate JWT payload
   * WHEN: Token verify hone ke baad automatically call hoga
   * @returns User object jo request.user mein attach hoga
   */
  async validate(payload: JwtPayload) {
    // Verify user exists aur active hai
    const user = await this.usersService.findOne(payload.sub);

    if (!user) {
      throw new UnauthorizedException(ErrorMessages.USER_NOT_FOUND);
    }

    if (!user.isActive) {
      throw new UnauthorizedException(ErrorMessages.USER_INACTIVE);
    }

    // 🔥 CONSISTENT FORMAT: Return object jo request.user ban jayega
    return {
      userId: payload.sub, // Consistent naming
      sub: payload.sub, // JWT standard (for compatibility)
      email: payload.email,
      role: payload.role,
    };
  }
}
