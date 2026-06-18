import {
  Controller,
  Post,
  Delete,
  Body,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AwsS3Service } from './aws-s3.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { DeleteFileDto, DeleteMultipleFilesDto } from './dto/aws-upload.dto';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class AwsUploadController {
  constructor(private readonly awsS3Service: AwsS3Service) {}

  /**
   * Upload single image
   * POST /api/upload/image
   */
  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    const result = await this.awsS3Service.uploadImage(file, user.userId);
    return {
      message: 'Image uploaded successfully',
      data: result,
    };
  }

  /**
   * Upload single video
   * POST /api/upload/video
   */
  @Post('video')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    const result = await this.awsS3Service.uploadVideo(file, user.userId);
    return {
      message: 'Video uploaded successfully',
      data: result,
    };
  }

  /**
   * Upload multiple images
   * POST /api/upload/images
   */
  @Post('images')
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  @HttpCode(HttpStatus.OK)
  async uploadMultipleImages(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: any,
  ) {
    const results = await this.awsS3Service.uploadMultipleImages(
      files,
      user.userId,
    );
    return {
      message: `${results.length} images uploaded successfully`,
      data: results,
    };
  }

  /**
   * Upload multiple videos
   * POST /api/upload/videos
   */
  @Post('videos')
  @UseInterceptors(FilesInterceptor('files', 5)) // Max 5 videos
  @HttpCode(HttpStatus.OK)
  async uploadMultipleVideos(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: any,
  ) {
    const results = await this.awsS3Service.uploadMultipleVideos(
      files,
      user.userId,
    );
    return {
      message: `${results.length} videos uploaded successfully`,
      data: results,
    };
  }

  /**
   * Upload mixed files (images + videos)
   * POST /api/upload/mixed
   */
  @Post('mixed')
  @UseInterceptors(FilesInterceptor('files', 15)) // Max 15 files
  @HttpCode(HttpStatus.OK)
  async uploadMixedFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: any,
  ) {
    const results = await this.awsS3Service.uploadMixedFiles(files, user.userId);
    return {
      message: 'Files uploaded successfully',
      data: results,
    };
  }

  /**
   * Delete single file
   * DELETE /api/upload/file
   */
  @Delete('file')
  @HttpCode(HttpStatus.OK)
  async deleteFile(@Body() deleteFileDto: DeleteFileDto) {
    await this.awsS3Service.deleteFile(deleteFileDto.key);
    return {
      message: 'File deleted successfully',
    };
  }

  /**
   * Delete multiple files
   * DELETE /api/upload/files
   */
  @Delete('files')
  @HttpCode(HttpStatus.OK)
  async deleteMultipleFiles(@Body() deleteMultipleFilesDto: DeleteMultipleFilesDto) {
    await this.awsS3Service.deleteMultipleFiles(deleteMultipleFilesDto.keys);
    return {
      message: `${deleteMultipleFilesDto.keys.length} files deleted successfully`,
    };
  }

  /**
   * Get signed URL for private file
   * POST /api/upload/signed-url
   */
  @Post('signed-url')
  @HttpCode(HttpStatus.OK)
  async getSignedUrl(@Body() body: { key: string; expiresIn?: number }) {
    const url = await this.awsS3Service.getSignedUrl(
      body.key,
      body.expiresIn || 3600,
    );
    return {
      message: 'Signed URL generated successfully',
      data: { url },
    };
  }
}
