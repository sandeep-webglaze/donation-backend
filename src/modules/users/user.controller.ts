import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, Role } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './user.service';
import { Public } from '../../common/decorators/public.decorator';
import { AwsS3Service } from '../uploads/aws-s3.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly awsS3Service: AwsS3Service, // ✅ Inject AWS Service
  ) {}

  /**
   * Create new user (Admin only)
   * POST /api/users
   */
  @Post()
  @Roles(Role.ADMIN)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  /**
   * Get all users with pagination (Public)
   * GET /api/users
   */
  @Get()
  @Public()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.usersService.findAll(paginationDto);
  }

  /**
   * Get current user profile
   * GET /api/users/profile
   * ⚠️ IMPORTANT: This route MUST come BEFORE :id route
   */
  @Get('profile')
  getProfile(@CurrentUser() user: any) {
    console.log('Current User:', user);
    return this.usersService.findOne(user.sub); // ✅ Use user.sub (not user.userId)
  }

  /**
   * ✅ NEW: Upload/Update Profile Picture
   * POST /api/users/profile/picture
   * Body: multipart/form-data with 'file' field
   */
  @Post('profile/picture')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePicture(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Get current user to check existing avatar
    const currentUser = await this.usersService.findOne(user.sub);

    // Delete old avatar if exists
    if (currentUser.avatarKey) {
      try {
        await this.awsS3Service.deleteFile(currentUser.avatarKey);
        console.log('✅ Old profile picture deleted:', currentUser.avatarKey);
      } catch (error) {
        console.error('⚠️ Failed to delete old avatar:', error);
        // Continue even if deletion fails
      }
    }

    // Upload new avatar
    const uploadResult = await this.awsS3Service.uploadImage(file, user.sub);

    // Update user profile
    const updatedUser = await this.usersService.updateProfilePicture(
      user.sub,
      uploadResult.url,
      uploadResult.key,
    );

    return {
      message: 'Profile picture updated successfully',
      data: updatedUser,
    };
  }

  /**
   * ✅ NEW: Delete Profile Picture
   * DELETE /api/users/profile/picture
   */
  @Delete('profile/picture')
  async deleteProfilePicture(@CurrentUser() user: any) {
    const currentUser = await this.usersService.findOne(user.sub);

    if (!currentUser.avatarKey) {
      throw new BadRequestException('No profile picture to delete');
    }

    // Delete from S3
    await this.awsS3Service.deleteFile(currentUser.avatarKey);

    // Update user (set avatar to null)
    const updatedUser = await this.usersService.deleteProfilePicture(user.sub);

    return {
      message: 'Profile picture deleted successfully',
      data: updatedUser,
    };
  }

  /**
   * Get user by ID (Admin only)
   * GET /api/users/:id
   */
  @Get(':id')
  @Roles(Role.ADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  /**
   * Update user
   * PATCH /api/users/:id
   * Users can only update their own profile, admins can update any
   */
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: any,
  ) {
    // Authorization check
    if (user.role !== 'admin' && user.sub !== id) {
      throw new BadRequestException('Unauthorized: You can only update your own profile');
    }
    return this.usersService.update(id, updateUserDto);
  }

  /**
   * Delete user (Admin only)
   * DELETE /api/users/:id
   */
  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}