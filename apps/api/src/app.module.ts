import { Controller, Get, Module } from '@nestjs/common';

@Controller('health')
class HealthController {
  @Get()
  health() {
    return { status: 'ok', service: 'hrm-api' };
  }
}

@Module({
  controllers: [HealthController],
})
export class AppModule {}
