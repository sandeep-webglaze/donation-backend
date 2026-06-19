import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GalleryService } from './gallery.service';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role, Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('gallery')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  /** Public — used by the website. Optional ?pageKey=home&section=hero */
  @Get()
  @Public()
  findAll(
    @Query('pageKey') pageKey?: string,
    @Query('section') section?: string,
  ) {
    return this.galleryService.findAll(pageKey, section);
  }

  /** Admin — add an image/video. */
  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  create(@Body() dto: CreateGalleryDto) {
    return this.galleryService.create(dto);
  }

  /** Admin — edit caption / section / order. */
  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGalleryDto,
  ) {
    return this.galleryService.update(id, dto);
  }

  /** Admin — delete. */
  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.galleryService.remove(id);
  }
}
