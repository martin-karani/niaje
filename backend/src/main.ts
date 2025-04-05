import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
// import compression from 'compression';
import * as cookieParser from 'cookie-parser';

import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  app.set('trust proxy', true);
  app.use(helmet({ contentSecurityPolicy: false }));

  app.use(cookieParser());

  app.enableCors({
    origin: process.env.ORIGIN?.split(',') || '*',
    credentials: true,
  });
  // app.use(compression());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      stopAtFirstError: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);

  Logger.log(`Server running on ${await app.getUrl()}`, 'Bootstrap');
  Logger.log(
    `Better Auth API Spec on: ${await app.getUrl()}/api/auth/docs`,
    'Bootstrap',
  );
}
bootstrap();
