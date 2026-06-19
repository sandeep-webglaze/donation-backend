import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role, Roles } from '../../common/decorators/roles.decorator';
import { CloudinaryService } from './cloudinary.service';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

/**
 * File upload → Cloudinary when configured, else local /public/uploads.
 * Returns { url, filename, type, size }.
 */
@Controller('media')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MediaController {
  constructor(private readonly cloudinary: CloudinaryService) {}

  @Post('upload')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @UseInterceptors(
    // Keep the file in memory so we can stream it to Cloudinary (or write to disk).
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 100 * 1024 * 1024 }, // 100MB (videos)
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const isVideo = file.mimetype.startsWith('video/');

    // 1) Cloudinary (production / when env is set)
    if (this.cloudinary.isEnabled()) {
      const res = await this.cloudinary.uploadBuffer(file.buffer);
      return {
        url: res.secure_url,
        filename: res.public_id,
        type: res.resource_type === 'video' ? 'video' : 'image',
        size: res.bytes,
      };
    }

    // 2) Local disk fallback (dev)
    if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
    const filename = `${uuidv4()}${extname(file.originalname).toLowerCase()}`;
    writeFileSync(join(UPLOAD_DIR, filename), file.buffer);
    const base =
      process.env.APP_URL || `http://localhost:${process.env.PORT || 8080}`;
    return {
      url: `${base}/uploads/${filename}`,
      filename,
      type: isVideo ? 'video' : 'image',
      size: file.size,
    };
  }
}
