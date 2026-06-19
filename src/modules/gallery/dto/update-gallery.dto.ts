import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';

/** Edit an existing gallery item (caption, section, order, type). */
export class UpdateGalleryDto {
  @IsOptional()
  @IsIn(['image', 'video'])
  type?: 'image' | 'video';

  @IsOptional()
  @IsString()
  pageKey?: string;

  @IsOptional()
  @IsString()
  section?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
