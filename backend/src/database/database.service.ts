import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Knex, knex } from 'knex';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly knexInstance: Knex;

  constructor(private configService: ConfigService) {
    this.knexInstance = knex({
      client: 'postgresql',
      connection: {
        host: this.configService.get<string>('POSTGRES_HOST', 'localhost'),
        port: this.configService.get<number>('POSTGRES_PORT', 5432),
        user: this.configService.get<string>('POSTGRES_USER', 'defaultuser'),
        password: this.configService.get<string>(
          'POSTGRES_PASSWORD',
          'defaultpassword',
        ),
        database: this.configService.get<string>(
          'POSTGRES_DATABASE',
          'defaultdb',
        ),
      },
      pool: {
        min: 2,
        max: 10,
      },
    });
  }

  getKnexInstance(): Knex {
    return this.knexInstance;
  }

  async onModuleDestroy() {
    await this.knexInstance.destroy();
  }
}
