import { IsIn, IsInt, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class CreateGalleryDto {
  @IsOptional()
  @IsIn(['image', 'video'])
  type?: 'image' | 'video';

  @IsOptional()
  @IsString()
  pageKey?: string;

  @IsOptional()
  @IsString()
  section?: string;

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
