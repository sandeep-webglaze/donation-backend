import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ValidationMessages } from 'src/common/constants/validation-messages';

/**
 * DTO for user registration
 * USE: Signup form validation
 */
export class EmailRegisterDto {
  @IsNotEmpty({ message: ValidationMessages.NAME_REQUIRED })
  @IsString()
  @MinLength(2, { message: ValidationMessages.NAME_MIN_LENGTH })
  @MaxLength(50, { message: ValidationMessages.NAME_MAX_LENGTH })
  @Transform(({ value }) => value.trim())
  name: string;

  @IsEmail({}, { message: ValidationMessages.EMAIL_INVALID })
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @IsNotEmpty({ message: ValidationMessages.PASSWORD_REQUIRED })
  @IsString()
  @MinLength(8, { message: ValidationMessages.PASSWORD_MIN_LENGTH })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: ValidationMessages.PASSWORD_WEAK,
  })
  password: string;
}
