import { IsNotEmpty, IsString, IsArray, IsOptional, IsNumber } from 'class-validator';

export class DeleteFileDto {
  @IsNotEmpty({ message: 'File key is required' })
  @IsString()
  key: string;
}

export class DeleteMultipleFilesDto {
  @IsNotEmpty({ message: 'File keys are required' })
  @IsArray()
  @IsString({ each: true })
  keys: string[];
}

export class GetSignedUrlDto {
  @IsNotEmpty({ message: 'File key is required' })
  @IsString()
  key: string;

  @IsOptional()
  @IsNumber()
  expiresIn?: number; // in seconds
}
