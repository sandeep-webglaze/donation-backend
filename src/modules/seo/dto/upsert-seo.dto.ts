import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

/** All fields optional — admin sets whatever SEO it wants for a page key. */
export class UpsertSeoDto {
  @IsOptional() @IsString() @MaxLength(120)
  label?: string;

  @IsOptional() @IsString() @MaxLength(160)
  metaTitle?: string;

  @IsOptional() @IsString() @MaxLength(320)
  metaDescription?: string;

  @IsOptional() @IsString()
  metaKeywords?: string;

  @IsOptional() @IsString() @MaxLength(160)
  ogTitle?: string;

  @IsOptional() @IsString() @MaxLength(320)
  ogDescription?: string;

  @IsOptional() @IsString()
  ogImage?: string;

  @IsOptional() @IsString()
  canonicalUrl?: string;

  @IsOptional() @IsBoolean()
  noIndex?: boolean;
}
