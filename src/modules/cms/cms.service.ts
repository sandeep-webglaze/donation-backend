import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';

@Injectable()
export class CmsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Convert a title to a URL-safe slug. */
  private slugify(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private isUnique(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }

  private isNotFound(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    );
  }

  /** Create a CMS page (admin). */
  async create(dto: CreatePageDto) {
    const slug = dto.slug || this.slugify(dto.title);
    try {
      return await this.prisma.cmsPage.create({
        data: { ...dto, slug },
      });
    } catch (error) {
      if (this.isUnique(error)) {
        throw new ConflictException(`A page with slug "${slug}" already exists`);
      }
      throw error;
    }
  }

  /** Paginated + searchable list (admin). Optional status filter. */
  async findAll(paginationDto: PaginationDto, status?: string) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
    } = paginationDto;

    const where: Prisma.CmsPageWhereInput = {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { slug: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.cmsPage.findMany({
        where,
        orderBy: { [sortBy]: sortOrder } as Prisma.CmsPageOrderByWithRelationInput,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.cmsPage.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /** Public — list all PUBLISHED pages (used for sitemap / footer quick links). */
  findPublished() {
    return this.prisma.cmsPage.findMany({
      where: { status: 'published' },
      select: { slug: true, title: true, updatedAt: true },
      orderBy: { title: 'asc' },
    });
  }

  /** Get one page by id (admin editing). */
  async findOne(id: string) {
    const page = await this.prisma.cmsPage.findUnique({ where: { id } });
    if (!page) throw new NotFoundException('Page not found');
    return page;
  }

  /** Public — only returns a PUBLISHED page by slug. */
  async findBySlug(slug: string) {
    const page = await this.prisma.cmsPage.findFirst({
      where: { slug, status: 'published' },
    });
    if (!page) throw new NotFoundException('Page not found');
    return page;
  }

  /** Update a page (admin). */
  async update(id: string, dto: UpdatePageDto) {
    try {
      return await this.prisma.cmsPage.update({ where: { id }, data: dto });
    } catch (error) {
      if (this.isNotFound(error)) throw new NotFoundException('Page not found');
      if (this.isUnique(error)) {
        throw new ConflictException('Another page already uses this slug');
      }
      throw error;
    }
  }

  /** Publish / unpublish a page (admin). */
  async setStatus(id: string, status: 'draft' | 'published') {
    try {
      return await this.prisma.cmsPage.update({ where: { id }, data: { status } });
    } catch (error) {
      if (this.isNotFound(error)) throw new NotFoundException('Page not found');
      throw error;
    }
  }

  /** Delete a page (admin). */
  async remove(id: string): Promise<void> {
    try {
      await this.prisma.cmsPage.delete({ where: { id } });
    } catch (error) {
      if (this.isNotFound(error)) throw new NotFoundException('Page not found');
      throw error;
    }
  }
}
