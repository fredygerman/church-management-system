import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { getHealthInfo } from '../helpers/util';
import { Public } from '../auth/decorators';

@ApiTags('Health')
@Controller('health')
@Public()
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Get comprehensive health status' })
  @ApiResponse({
    status: 200,
    description: 'Returns comprehensive application health information',
    schema: {
      example: {
        success: true,
        message: 'Request successful',
        data: {
          status: 'ok',
          timestamp: '2023-10-21T10:30:00.000Z',
          environment: 'development',
          version: '1.0.0',
          node: 'v20.5.0',
          uptime: 123.456,
          memory: {
            rss: 45678912,
            heapTotal: 12345678,
            heapUsed: 8765432,
            external: 987654,
          },
          features: {
            enabled: ['Database', 'JWT Authentication'],
            disabled: ['Redis Cache', 'Email Service'],
          },
        },
      },
    },
  })
  getHealth() {
    return getHealthInfo();
  }

  @Get('simple')
  @ApiOperation({ summary: 'Simple health check' })
  @ApiResponse({
    status: 200,
    description: 'Simple OK response',
    schema: {
      example: {
        success: true,
        message: 'Request successful',
        data: {
          status: 'ok',
          timestamp: '2023-10-21T10:30:00.000Z',
        },
      },
    },
  })
  getSimpleHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
