import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { UpsertContentDto } from './dto/upsert-content.dto';

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  /** Public — all content blocks for a page. */
  findByPage(pageKey: string) {
    return this.prisma.contentBlock.findMany({ where: { pageKey } });
  }

  /** Admin — every content block (for the Pages manager). */
  findAll() {
    return this.prisma.contentBlock.findMany();
  }

  /** Admin — create/update a section's content. */
  upsert(pageKey: string, sectionKey: string, dto: UpsertContentDto) {
    const data = {
      title: dto.title,
      subtitle: dto.subtitle,
      body: dto.body,
      settings: (dto.settings ?? undefined) as Prisma.InputJsonValue | undefined,
    };
    return this.prisma.contentBlock.upsert({
      where: { pageKey_sectionKey: { pageKey, sectionKey } },
      create: { pageKey, sectionKey, ...data },
      update: data,
    });
  }
}
