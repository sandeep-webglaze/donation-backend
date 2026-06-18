import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Role } from 'src/common/decorators/roles.decorator';
import { ErrorMessages } from 'src/common/constants/error-messages';

/**
 * Public-safe fields (everything except the password hash).
 * Reused everywhere we return a user to the client.
 */
const SAFE_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  address: true,
  role: true,
  avatar: true,
  avatarKey: true,
  isActive: true,
  isEmailVerified: true,
  isPhoneVerified: true,
  lastLogin: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Hash a plain password. */
  private hash(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /** Compare a plain password against a stored hash. */
  verifyPassword(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }

  private isNotFound(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    );
  }

  /**
   * Create a new user (password is hashed automatically).
   */
  async create(createUserDto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });
    if (existing) {
      throw new ConflictException(ErrorMessages.USER_ALREADY_EXISTS);
    }

    return this.prisma.user.create({
      data: {
        ...createUserDto,
        password: await this.hash(createUserDto.password),
        role: createUserDto.role ?? Role.USER,
      },
      select: SAFE_SELECT,
    });
  }

  /**
   * Paginated + searchable list of users (without passwords).
   */
  async findAll(paginationDto: PaginationDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = paginationDto;

    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: SAFE_SELECT,
        orderBy: { [sortBy]: sortOrder } as Prisma.UserOrderByWithRelationInput,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Find a single user by id (without password).
   */
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: SAFE_SELECT,
    });
    if (!user) {
      throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);
    }
    return user;
  }

  /**
   * Find user by phone (without password) — used for OTP login/registration.
   */
  findByPhone(phone: string) {
    return this.prisma.user.findUnique({
      where: { phone },
      select: SAFE_SELECT,
    });
  }

  /**
   * Find user by email INCLUDING the password hash — for auth only.
   */
  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /**
   * Update user information.
   */
  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
        select: SAFE_SELECT,
      });
    } catch (error) {
      if (this.isNotFound(error)) {
        throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);
      }
      throw error;
    }
  }

  /**
   * Delete a user.
   */
  async remove(id: string): Promise<void> {
    try {
      await this.prisma.user.delete({ where: { id } });
    } catch (error) {
      if (this.isNotFound(error)) {
        throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);
      }
      throw error;
    }
  }

  /**
   * Update password (hashes the new password).
   */
  async updatePassword(userId: string, newPassword: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { password: await this.hash(newPassword) },
      });
    } catch (error) {
      if (this.isNotFound(error)) {
        throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);
      }
      throw error;
    }
  }

  /** Update the last-login timestamp. */
  async updateLastLogin(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLogin: new Date() },
    });
  }

  /**
   * Set the user's profile picture.
   */
  updateProfilePicture(userId: string, avatarUrl: string, avatarKey: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl, avatarKey },
      select: SAFE_SELECT,
    });
  }

  /**
   * Remove the user's profile picture.
   */
  deleteProfilePicture(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatar: null, avatarKey: null },
      select: SAFE_SELECT,
    });
  }
}
