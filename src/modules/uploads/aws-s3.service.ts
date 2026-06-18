import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
  url: string;
  key: string;
  bucket: string;
  size: number;
  mimeType: string;
}

@Injectable()
export class AwsS3Service {
  private readonly logger = new Logger(AwsS3Service.name);
  private readonly s3Client: S3Client;

  private readonly bucket: string;
  private readonly region: string;
  private readonly cloudFrontUrl?: string;

  private readonly maxFileSize: number;
  private readonly maxVideoSize: number;
  private readonly allowedImageTypes: string[];
  private readonly allowedVideoTypes: string[];

  constructor(private readonly configService: ConfigService) {
    const accessKeyId =
      this.configService.get<string>('aws.s3.accessKeyId')!;
    const secretAccessKey =
      this.configService.get<string>('aws.s3.secretAccessKey')!;

    this.region =
      this.configService.get<string>('aws.s3.region') ?? 'ap-south-1';

    this.bucket =
      this.configService.get<string>('aws.s3.bucket')!;

    this.cloudFrontUrl =
      this.configService.get<string>('aws.s3.cloudFrontUrl');

    this.maxFileSize =
      this.configService.get<number>('aws.s3.maxFileSize') ?? 10 * 1024 * 1024;

    this.maxVideoSize =
      this.configService.get<number>('aws.s3.maxVideoSize') ?? 100 * 1024 * 1024;

    this.allowedImageTypes =
      this.configService.get<string[]>('aws.s3.allowedImageTypes') ?? [
        'image/jpeg',
        'image/png',
        'image/webp',
      ];

    this.allowedVideoTypes =
      this.configService.get<string[]>('aws.s3.allowedVideoTypes') ?? [
        'video/mp4',
        'video/mpeg',
        'video/quicktime',
      ];

    if (!accessKeyId || !secretAccessKey || !this.bucket) {
      throw new Error('AWS S3 credentials missing');
    }

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.logger.log('✅ AWS S3 Client initialized');
  }

  /* =====================================================
     SINGLE IMAGE
  ===================================================== */

  async uploadImage(
    file: Express.Multer.File,
    userId?: string,
  ): Promise<UploadResult> {
    if (!this.allowedImageTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid image type');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException('Image size exceeds limit');
    }

    let buffer = file.buffer;

    try {
      buffer = await sharp(file.buffer)
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
    } catch {
      this.logger.warn('Image compression failed, original used');
    }

    const filename = `${uuidv4()}.jpg`;
    const basePath = userId ? 'users/images' : 'images';
    const key = userId
      ? `${basePath}/${userId}/${filename}`
      : `${basePath}/${filename}`;

    return this.uploadToS3(key, buffer, 'image/jpeg');
  }

  /* =====================================================
     SINGLE VIDEO
  ===================================================== */

  async uploadVideo(
    file: Express.Multer.File,
    userId?: string,
  ): Promise<UploadResult> {
    if (!this.allowedVideoTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid video type');
    }

    if (file.size > this.maxVideoSize) {
      throw new BadRequestException('Video size exceeds limit');
    }

    const ext = file.originalname.split('.').pop() ?? 'mp4';
    const filename = `${uuidv4()}.${ext}`;
    const basePath = 'videos';

    const key = userId
      ? `${basePath}/${userId}/${filename}`
      : `${basePath}/${filename}`;

    return this.uploadToS3(key, file.buffer, file.mimetype);
  }

  /* =====================================================
     MULTIPLE IMAGES ✅ FIXED
  ===================================================== */

  async uploadMultipleImages(
    files: Express.Multer.File[],
    userId?: string,
  ): Promise<UploadResult[]> {
    return Promise.all(
      files.map((file) => this.uploadImage(file, userId)),
    );
  }

  /* =====================================================
     MULTIPLE VIDEOS ✅ FIXED
  ===================================================== */

  async uploadMultipleVideos(
    files: Express.Multer.File[],
    userId?: string,
  ): Promise<UploadResult[]> {
    return Promise.all(
      files.map((file) => this.uploadVideo(file, userId)),
    );
  }

  /* =====================================================
     MIXED FILES (IMAGES + VIDEOS) ✅ FIXED
  ===================================================== */

  async uploadMixedFiles(
    files: Express.Multer.File[],
    userId?: string,
  ): Promise<{ images: UploadResult[]; videos: UploadResult[] }> {
    const images: UploadResult[] = [];
    const videos: UploadResult[] = [];

    for (const file of files) {
      if (this.allowedImageTypes.includes(file.mimetype)) {
        images.push(await this.uploadImage(file, userId));
      } else if (this.allowedVideoTypes.includes(file.mimetype)) {
        videos.push(await this.uploadVideo(file, userId));
      } else {
        this.logger.warn(`Unsupported file skipped: ${file.mimetype}`);
      }
    }

    return { images, videos };
  }

  /* =====================================================
     CORE UPLOAD
  ===================================================== */

  private async uploadToS3(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<UploadResult> {
    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
          ACL: 'public-read',
        }),
      );

      const url = this.cloudFrontUrl
        ? `${this.cloudFrontUrl}/${key}`
        : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

      return {
        url,
        key,
        bucket: this.bucket,
        size: buffer.length,
        mimeType: contentType,
      };
    } catch (err) {
      this.logger.error('Upload failed', err);
      throw new InternalServerErrorException('S3 upload failed');
    }
  }

  /* =====================================================
     DELETE
  ===================================================== */

  async deleteFile(key: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  async deleteMultipleFiles(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.deleteFile(key)));
    this.logger.log(`✅ ${keys.length} files deleted`);
  }

  /* =====================================================
     SIGNED URL
  ===================================================== */

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    return getSignedUrl(
      this.s3Client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
      { expiresIn },
    );
  }
}
