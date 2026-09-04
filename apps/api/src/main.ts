import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Module, Controller, Get } from '@nestjs/common';

@Controller('health')
class HealthController {
  @Get()
  getHealth() {
    return { status: 'ok', service: 'api' };
  }
}

@Module({ controllers: [HealthController] })
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  await app.listen(process.env.PORT ?? 4000);
}

void bootstrap();
