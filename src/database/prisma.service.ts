import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * 🐘 PRISMA SERVICE
 * Single PrismaClient instance shared across the app.
 * Reads the connection string from the DATABASE_URL env var.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('✅ PostgreSQL connected (Prisma)');
    } catch (error) {
      this.logger.error('❌ PostgreSQL connection failed', error as Error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
