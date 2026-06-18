import { IsNotEmpty, IsString, IsEnum, Matches } from 'class-validator';

export class SendOtpDto {
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone number must be in E.164 format (e.g., +911234567890)',
  })
  phoneNumber: string;

  @IsEnum(['sms', 'whatsapp'], {
    message: 'Provider must be either "sms" or "whatsapp"',
  })
  provider: 'sms' | 'whatsapp';
}

export class VerifyOtpDto {
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone number must be in E.164 format (e.g., +911234567890)',
  })
  phoneNumber: string;

  @IsNotEmpty({ message: 'OTP is required' })
  @IsString()
  @Matches(/^\d{6}$/, {
    message: 'OTP must be a 6-digit number',
  })
  otp: string;
}

export class ResendOtpDto {
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone number must be in E.164 format (e.g., +911234567890)',
  })
  phoneNumber: string;

  @IsEnum(['sms', 'whatsapp'], {
    message: 'Provider must be either "sms" or "whatsapp"',
  })
  provider: 'sms' | 'whatsapp';
}