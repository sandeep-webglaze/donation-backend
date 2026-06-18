import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsBoolean } from 'class-validator';

/**
 * DTO for updating user information
 * USE: User profile update aur admin user management mein
 * NOTE: Password aur email update nahi ho sakta (security reasons)
 */
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password', 'email'] as const),
) {
  // Admin can activate/deactivate users
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
