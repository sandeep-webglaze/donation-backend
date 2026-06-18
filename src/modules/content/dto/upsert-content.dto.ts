import { IsOptional, IsString } from 'class-validator';

export class UpsertContentDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() subtitle?: string;
  @IsOptional() @IsString() body?: string;

  /** Flexible extras (button label/href, etc.) — any JSON object. */
  @IsOptional()
  settings?: Record<string, unknown>;
}
