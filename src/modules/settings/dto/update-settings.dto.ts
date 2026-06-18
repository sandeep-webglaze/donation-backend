import { IsOptional, IsString, IsEmail, MaxLength } from 'class-validator';

/**
 * All fields optional — admin can update any subset of the singleton settings.
 */
export class UpdateSettingsDto {
  // ── Basic ──
  @IsOptional() @IsString() @MaxLength(120)
  siteName?: string;

  @IsOptional() @IsString()
  logo?: string;

  @IsOptional() @IsString()
  favicon?: string;

  @IsOptional() @IsEmail()
  email?: string;

  @IsOptional() @IsString() @MaxLength(40)
  phone?: string;

  @IsOptional() @IsString() @MaxLength(40)
  whatsapp?: string;

  @IsOptional() @IsString() @MaxLength(300)
  address?: string;

  // ── Social ──
  @IsOptional() @IsString() facebook?: string;
  @IsOptional() @IsString() instagram?: string;
  @IsOptional() @IsString() linkedin?: string;
  @IsOptional() @IsString() twitter?: string;

  // ── SEO ──
  @IsOptional() @IsString() @MaxLength(160) metaTitle?: string;
  @IsOptional() @IsString() @MaxLength(320) metaDescription?: string;
  @IsOptional() @IsString() metaKeywords?: string;
  @IsOptional() @IsString() ogImage?: string;
  @IsOptional() @IsString() canonicalUrl?: string;

  // ── Misc ──
  @IsOptional() @IsString() @MaxLength(200) copyrightText?: string;
}
