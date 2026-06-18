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
import { CmsService } from './cms.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role, Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('cms/pages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  /** Admin — list pages (paginated, searchable, status filter). */
  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  findAll(@Query() paginationDto: PaginationDto, @Query('status') status?: string) {
    return this.cmsService.findAll(paginationDto, status);
  }

  /** Public — list all published pages (sitemap / footer links). */
  @Get('public')
  @Public()
  findPublished() {
    return this.cmsService.findPublished();
  }

  /** Public — fetch a PUBLISHED page by slug (for the website). */
  @Get('slug/:slug')
  @Public()
  findBySlug(@Param('slug') slug: string) {
    return this.cmsService.findBySlug(slug);
  }

  /** Admin — get one page by id (for editing). */
  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.findOne(id);
  }

  /** Admin — create a page. */
  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  create(@Body() dto: CreatePageDto) {
    return this.cmsService.create(dto);
  }

  /** Admin — update a page. */
  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePageDto) {
    return this.cmsService.update(id, dto);
  }

  /** Admin — publish a page. */
  @Patch(':id/publish')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  publish(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.setStatus(id, 'published');
  }

  /** Admin — unpublish a page. */
  @Patch(':id/unpublish')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  unpublish(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.setStatus(id, 'draft');
  }

  /** Admin — delete a page. */
  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.remove(id);
  }
}
