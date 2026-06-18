import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  Matches,
  IsPhoneNumber,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Role } from 'src/common/decorators/roles.decorator';
import { ValidationMessages } from 'src/common/constants/validation-messages';

/**
 * DTO for creating a new user
 * USE: User registration aur admin user creation mein
 */
export class CreateUserDto {
  // Name field with validation
  @IsNotEmpty({ message: ValidationMessages.NAME_REQUIRED })
  @IsString()
  @MinLength(2, { message: ValidationMessages.NAME_MIN_LENGTH })
  @MaxLength(50, { message: ValidationMessages.NAME_MAX_LENGTH })
  @Transform(({ value }) => value?.trim())
  name: string;

  // Email field with auto-formatting
  @IsEmail({}, { message: ValidationMessages.EMAIL_INVALID })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  // Password with strong validation
  @IsString()
  @MinLength(8, { message: ValidationMessages.PASSWORD_MIN_LENGTH })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: ValidationMessages.PASSWORD_WEAK,
  })
  password: string;

  // Optional phone number
  @IsOptional()
  @IsPhoneNumber(undefined, { message: ValidationMessages.PHONE_INVALID })
  phone?: string;

  // Optional address
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  // Role assignment (only for admin)
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  // Optional avatar URL
  @IsOptional()
  @IsString()
  avatar?: string;
}