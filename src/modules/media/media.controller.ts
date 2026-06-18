import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role, Roles } from '../../common/decorators/roles.decorator';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

/**
 * Simple file upload → saves to /public/uploads and returns a public URL.
 * Served statically at  <APP_URL>/uploads/<file>.
 * (Swap to Cloudinary/S3 later by changing this controller only.)
 */
@Controller('media')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MediaController {
  @Post('upload')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) =>
          cb(null, `${uuidv4()}${extname(file.originalname).toLowerCase()}`),
      }),
      limits: { fileSize: 100 * 1024 * 1024 }, // 100MB (videos)
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const base =
      process.env.APP_URL || `http://localhost:${process.env.PORT || 8080}`;
    const isVideo = file.mimetype.startsWith('video/');
    return {
      url: `${base}/uploads/${file.filename}`,
      filename: file.filename,
      type: isVideo ? 'video' : 'image',
      size: file.size,
    };
  }
}
