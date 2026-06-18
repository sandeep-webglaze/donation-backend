import { IsIn, IsInt, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class CreateGalleryDto {
  @IsOptional()
  @IsIn(['image', 'video'])
  type?: 'image' | 'video';

  @IsOptional()
  @IsIn(['hero', 'about', 'gallery', 'media'])
  section?: 'hero' | 'about' | 'gallery' | 'media';

  @IsNotEmpty()
  @IsString()
  url: string;

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
