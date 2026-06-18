import { PartialType } from '@nestjs/mapped-types';
import { CreatePageDto } from './create-page.dto';

/** All fields from CreatePageDto, but optional. */
export class UpdatePageDto extends PartialType(CreatePageDto) {}
