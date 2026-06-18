import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import awsS3Config from 'src/config/aws-s3.config';
import { AwsUploadController } from './aws-upload.controller';
import { AwsS3Service } from './aws-s3.service';

@Module({
  imports: [ConfigModule.forFeature(awsS3Config)],
  controllers: [AwsUploadController],
  providers: [AwsS3Service],
  exports: [AwsS3Service],
})
export class AwsUploadModule {}
