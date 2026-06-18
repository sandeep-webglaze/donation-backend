import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EmailLoginDto } from './dto/email-login.dto';
import { EmailRegisterDto } from './dto/email-register.dto';
import { EmailChangePasswordDto } from './dto/email-change-password.dto';
import { EmailAuthService } from './email-auth.service';
import { Public } from 'src/common/decorators/public.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('auth')
export class EmailAuthController {
  constructor(private readonly authService: EmailAuthService) {}

  @Public()
  @Post('register')
  register(@Body() registerDto: EmailRegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: EmailLoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: EmailChangePasswordDto,
  ) {
    return this.authService.changePassword(user.userId, changePasswordDto);
  }
}
