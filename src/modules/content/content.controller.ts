import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ContentService } from './content.service';
import { UpsertContentDto } from './dto/upsert-content.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role, Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('content')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  /** Admin — all blocks (Pages manager). */
  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  findAll() {
    return this.contentService.findAll();
  }

  /** Public — all content blocks for a page. */
  @Get(':pageKey')
  @Public()
  findByPage(@Param('pageKey') pageKey: string) {
    return this.contentService.findByPage(pageKey);
  }

  /** Admin — upsert a section's content. */
  @Put(':pageKey/:sectionKey')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  upsert(
    @Param('pageKey') pageKey: string,
    @Param('sectionKey') sectionKey: string,
    @Body() dto: UpsertContentDto,
  ) {
    return this.contentService.upsert(pageKey, sectionKey, dto);
  }
}
