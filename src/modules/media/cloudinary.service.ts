import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

/**
 * Cloudinary uploader. Configures itself from env:
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 * If those aren't set, isEnabled() returns false and the controller falls back
 * to local disk storage — so local dev keeps working without Cloudinary.
 */
@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly enabled: boolean;

  constructor() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    this.enabled = Boolean(cloudName && apiKey && apiSecret);
    if (this.enabled) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.logger.log(`Cloudinary enabled (cloud: ${cloudName})`);
    } else {
      this.logger.warn('Cloudinary not configured — falling back to local disk uploads.');
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /** Upload a file buffer to Cloudinary. resource_type "auto" handles images + videos. */
  uploadBuffer(
    buffer: Buffer,
    folder = 'donation',
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'auto' },
        (error, result) => {
          if (error || !result) return reject(error || new Error('Upload failed'));
          resolve(result);
        },
      );
      stream.end(buffer);
    });
  }

  /** Delete an asset by its public_id (optional helper). */
  async destroy(publicId: string, resourceType: 'image' | 'video' = 'image') {
    if (!this.enabled) return;
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  }
}
