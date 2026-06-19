import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

  /** Admin — reset (delete) a page's SEO. */
  async remove(pageKey: string): Promise<void> {
    try {
      await this.prisma.seoMeta.delete({ where: { pageKey } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('SEO entry not found');
      }
      throw error;
    }
  }
}
