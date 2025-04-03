import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Helper method to clean the database during testing
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    // Add models to truncate here
    const models = ['Token', 'Session', 'Property', 'User'];

    // Disable foreign key checks and truncate tables
    return Promise.all(
      models.map(async (model) => {
        // @ts-ignore - Dynamically access model
        return this[model[0].toLowerCase() + model.slice(1)].deleteMany();
      }),
    );
  }
}
