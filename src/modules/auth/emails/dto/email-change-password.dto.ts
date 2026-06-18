import {
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
  IsBoolean,
} from 'class-validator';
import { ValidationMessages } from 'src/common/constants/validation-messages';

/**
 * DTO for changing user password
 * USE: Change password endpoint
 */
export class EmailChangePasswordDto {
  @IsNotEmpty({ message: ValidationMessages.PASSWORD_REQUIRED })
  @IsString()
  currentPassword: string;

  @IsNotEmpty({ message: ValidationMessages.PASSWORD_REQUIRED })
  @IsString()
  @MinLength(8, { message: ValidationMessages.PASSWORD_MIN_LENGTH })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: ValidationMessages.PASSWORD_WEAK,
  })
  newPassword: string;

  @IsNotEmpty({ message: ValidationMessages.PASSWORD_REQUIRED })
  @IsString()
  confirmNewPassword: string;

  @IsBoolean()
  @IsNotEmpty({ message: 'ValidationMessages.CHANGE_ON_FIRST_LOGIN_REQUIRED' })
  changeOnFirstLogin: boolean;
}
