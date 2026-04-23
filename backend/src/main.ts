import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const defaultOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
  const envOrigin = process.env.FRONTEND_URL;
  const allowedOrigins = envOrigin
    ? [envOrigin, ...defaultOrigins]
    : defaultOrigins;

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
