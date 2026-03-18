import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Keep raw body for Stripe webhook signature verification
    rawBody: true,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  // CORS: allow web app origin from env
  const webUrl = process.env.WEB_APP_URL || 'http://localhost:3000';
  app.enableCors({
    origin: [webUrl, 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-secret'],
  });

  // Global rate limiting: 60 requests per minute per IP
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use(rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: { success: false, message: 'Too many requests. Please wait.' },
    standardHeaders: true,
    legacyHeaders: false,
  }));

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}/api`);
}

bootstrap();
