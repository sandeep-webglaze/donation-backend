import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateGalleryDto } from './dto/create-gallery.dto';

@Injectable()
export class GalleryService {
  constructor(private readonly prisma: PrismaService) {}

  /** Public — gallery items, optionally filtered by page + section. */
  findAll(pageKey?: string, section?: string) {
    return this.prisma.galleryItem.findMany({
      where: {
        ...(pageKey ? { pageKey } : {}),
        ...(section ? { section } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /** Admin — add an item. */
  create(dto: CreateGalleryDto) {
    return this.prisma.galleryItem.create({
      data: {
        ...dto,
        type: dto.type ?? 'image',
        pageKey: dto.pageKey ?? 'home',
        section: dto.section ?? 'gallery',
      },
    });
  }

  /** Admin — delete an item. */
  async remove(id: string): Promise<void> {
    try {
      await this.prisma.galleryItem.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Gallery item not found');
      }
      throw error;
    }
  }
}
