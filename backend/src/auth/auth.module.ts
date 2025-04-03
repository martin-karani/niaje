import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { BetterGuard } from '../common/guards/auth-guard';

@Module({
  controllers: [AuthController],
  providers: [{ provide: APP_GUARD, useClass: BetterGuard }],
})
export class AuthModule {}
