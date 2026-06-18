import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { SeoService } from './seo.service';
import { UpsertSeoDto } from './dto/upsert-seo.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role, Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('seo')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  /** Admin — list all page SEO entries. */
  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  findAll() {
    return this.seoService.findAll();
  }

  /** Public — SEO for a page key (used by coded pages at build/SSR time). */
  @Get(':key')
  @Public()
  getByKey(@Param('key') key: string) {
    return this.seoService.getByKey(key);
  }

  /** Admin — create/update SEO for a page key. */
  @Put(':key')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  upsert(@Param('key') key: string, @Body() dto: UpsertSeoDto) {
    return this.seoService.upsert(key, dto);
  }
}
