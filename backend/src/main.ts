/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  // Starts listening for shutdown hooks
  app.enableShutdownHooks();
  app.set('trust proxy', 'loopback'); // Trust requests from the loopback address
  // Enable security headers
  app.use(helmet({ contentSecurityPolicy: false }));
  // Enable CORS
  app.enableCors({
    origin: process.env.ORIGIN?.split(',') || '*',
    credentials: true,
  });
  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      stopAtFirstError: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  await app.listen(process.env.PORT ?? 3001);
  Logger.log(
    `Server running on http://localhost:${process.env.PORT}`,
    'Bootstrap',
  );
  Logger.log(
    `Better Auth documentation running on http://localhost:${process.env.PORT}/api/auth/docs`,
    'Bootstrap',
  );
}
bootstrap();
