import 'tsconfig-paths/register';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import config from './config';
import * as express from 'express';
import { IncomingMessage, ServerResponse } from 'http';
import { getServiceStatus } from './helpers/util';
import { ServiceStatusUtil } from './helpers/service-status.util';

const { appUrl, port } = config;

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  logger.log('🚀 Starting Church API Service...');

  const app = await NestFactory.create(AppModule);

  // Get service status
  const { enabledFeatures, disabledFeatures } = getServiceStatus();

  // In production, log full system status
  if (config.nodeEnv === 'production') {
    const serviceStatusUtil = app.get(ServiceStatusUtil);
    const fullStatus = serviceStatusUtil.getStatus();

    logger.log('📱 Application Information:');
    logger.log(`   Name: ${fullStatus.app.name}`);
    logger.log(`   Version: ${fullStatus.app.version}`);
    logger.log(`   Environment: ${fullStatus.app.environment}`);

    if ('system' in fullStatus) {
      logger.log('💻 System Information:');
      logger.log(
        `   Platform: ${fullStatus.system.platform} | Arch: ${fullStatus.system.arch}`
      );
      logger.log(
        `   Node: ${fullStatus.system.nodeVersion} | CPUs: ${fullStatus.system.cpus}`
      );
      logger.log(
        `   Memory: ${fullStatus.system.memory.usage} used (${fullStatus.system.memory.free} free of ${fullStatus.system.memory.total})`
      );
      logger.log(
        `   Load Average: ${fullStatus.system.loadAvg.map(l => l.toFixed(2)).join(', ')}`
      );
    }
  }

  logger.log('📋 Enabled Features:');
  enabledFeatures.forEach(feature => logger.log(`   ✅ ${feature}`));

  if (disabledFeatures.length > 0) {
    logger.warn('⚠️  Disabled Features:');
    disabledFeatures.forEach(feature => logger.warn(`   ❌ ${feature}`));
  }

  // Configure express middleware directly
  app.use(
    express.json({
      verify: (
        req: IncomingMessage & { rawBody?: string },
        res: ServerResponse,
        buf: Buffer,
        encoding: string
      ) => {
        if (buf && buf.length) {
          req.rawBody = buf.toString((encoding as BufferEncoding) || 'utf8');
        }
      },
    })
  );
  logger.log('Express middleware configured successfully');

  // Apply the response interceptor globally
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Swagger API documentation setup
  const docConfig = new DocumentBuilder()
    .setTitle('Church API')
    .setDescription('The Church Management System API')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token'
    )
    .build();

  const document = SwaggerModule.createDocument(app, docConfig);
  SwaggerModule.setup('docs', app, document);

  // Enhanced validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // SwaggerModule.setup("docs", app, document);

  // CORS configuration
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  });

  // Start the server
  await app.listen(port, '0.0.0.0');

  logger.log(`
✅ API is running on port ${port}
📚 Docs: http://localhost:${port}/docs
🏥 Health: http://localhost:${port}/health
`);
}
bootstrap();
