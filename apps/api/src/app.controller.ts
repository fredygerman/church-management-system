import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './auth/decorators';

@ApiTags('App')
@Controller()
@Public()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get welcome message' })
  @ApiResponse({
    status: 200,
    description: 'Returns welcome message',
    schema: {
      example: {
        success: true,
        message: 'Request successful',
        data: 'Hello Church API!',
      },
    },
  })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({
    status: 200,
    description: 'Returns basic health status',
    schema: {
      example: {
        success: true,
        message: 'Request successful',
        data: {
          status: 'ok',
          timestamp: '2023-10-21T10:30:00.000Z',
          service: 'Church API',
        },
      },
    },
  })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Church API',
    };
  }
}
