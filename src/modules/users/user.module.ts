import { Module } from '@nestjs/common';
import { UsersService } from './user.service';
import { UsersController } from './user.controller';
import { AwsUploadModule } from '../uploads/aws-upload.module';

@Module({
  // PrismaService is provided globally by PrismaModule — no per-feature import needed.
  imports: [AwsUploadModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
