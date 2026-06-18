import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GalleryService } from './gallery.service';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role, Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('gallery')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  /** Public — used by the website. Optional ?section=hero|about|gallery|media */
  @Get()
  @Public()
  findAll(@Query('section') section?: string) {
    return this.galleryService.findAll(section);
  }

  /** Admin — add an image/video. */
  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  create(@Body() dto: CreateGalleryDto) {
    return this.galleryService.create(dto);
  }

  /** Admin — delete. */
  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.galleryService.remove(id);
  }
}
