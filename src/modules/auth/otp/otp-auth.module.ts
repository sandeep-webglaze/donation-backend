import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import otpConfig from 'src/config/otp.config';
import { UsersModule } from 'src/modules/users/user.module';
import { OtpAuthController } from './otp-auth.controller';
import { TwilioService } from './twilio.service';
import { OtpAuthService } from './otp-auth.service';

@Module({
  // PrismaService is provided globally by PrismaModule.
  imports: [ConfigModule.forFeature(otpConfig), UsersModule],
  controllers: [OtpAuthController],
  providers: [OtpAuthService, TwilioService],
  exports: [OtpAuthService, TwilioService],
})
export class OtpAuthModule {}
