import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { EmailAuthController } from './email-auth.controller';
import { UsersModule } from 'src/modules/users/user.module';
import { EmailAuthService } from './email-auth.service';
import { JwtStrategy } from '../strategies/jwt.strategy';

@Module({
  imports: [UsersModule, PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [EmailAuthController],
  providers: [EmailAuthService, JwtStrategy],
  exports: [EmailAuthService, PassportModule],
})
export class EmailAuthModule {}
