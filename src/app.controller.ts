import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Healthcheck/root endpoint' })
  @ApiResponse({ status: 200, description: 'Service is available' })
  getHello(): string {
    return this.appService.getHello();
  }
}
