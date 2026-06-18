import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpsertSeoDto } from './dto/upsert-seo.dto';

/**
 * Per-page SEO for hard-coded frontend pages (home, about, contact, ...).
 * Read publicly by the site, edited from the admin panel.
 */
@Injectable()
export class SeoService {
  constructor(private readonly prisma: PrismaService) {}

  /** Public — SEO for a page key (null if not configured yet). */
  getByKey(pageKey: string) {
    return this.prisma.seoMeta.findUnique({ where: { pageKey } });
  }

  /** Admin — list all configured page SEO entries. */
  findAll() {
    return this.prisma.seoMeta.findMany({ orderBy: { pageKey: 'asc' } });
  }

  /** Admin — create or update SEO for a page key. */
  upsert(pageKey: string, dto: UpsertSeoDto) {
    return this.prisma.seoMeta.upsert({
      where: { pageKey },
      create: { pageKey, ...dto },
      update: dto,
    });
  }
}
