import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * 🐘 PRISMA MODULE (Global)
 * Replaces the old Mongoose DatabaseModule. PrismaService is available
 * everywhere without re-importing this module.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
