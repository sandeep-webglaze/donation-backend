import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

/**
 * Settings is a single-row (singleton) table holding the whole site config.
 * `get()` always returns one row (creating an empty default on first call),
 * `update()` upserts that same row.
 */
@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Get the settings row, creating a default one if none exists yet. */
  async get() {
    const existing = await this.prisma.settings.findFirst();
    if (existing) return existing;
    return this.prisma.settings.create({ data: { siteName: '' } });
  }

  /** Update the singleton settings row (creates it if missing). */
  async update(dto: UpdateSettingsDto) {
    const current = await this.get();
    return this.prisma.settings.update({
      where: { id: current.id },
      data: dto,
    });
  }
}
