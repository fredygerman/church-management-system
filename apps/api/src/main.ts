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

const { appUrl, port, frontendUrl, nodeEnv } = config;

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  logger.log('🚀 Starting Church API Service...');

  // Get service configuration status
  const { enabledFeatures, disabledFeatures } = getServiceStatus();

  const app = await NestFactory.create(AppModule);

  // Configure express middleware directly
  app.use(
    express.json({
      verify: (
        req: IncomingMessage & { rawBody?: string },
        res: ServerResponse,
        buf: Buffer,
        encoding: string,
      ) => {
        if (buf && buf.length) {
          req.rawBody = buf.toString((encoding as BufferEncoding) || 'utf8');
        }
      },
    }),
  );
  logger.log('Express middleware configured successfully');

  // Apply the response interceptor globally
  app.useGlobalInterceptors(new ResponseInterceptor());

  const docConfig = new DocumentBuilder()
    .setTitle('Church API')
    .setDescription('The Church Management System API')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, docConfig);

  // Enhanced validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  SwaggerModule.setup('docs', app, document);

  // CORS configuration
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  });

  // Listen to 0.0.0.0 for Docker container accessibility
  await app.listen(port, '0.0.0.0');

  // Print the base URL and docs URL
  const baseUrl = `${appUrl}`;
  const docsUrl = `${baseUrl}/docs`;

  // Display service configuration status
  Logger.log(
    `\n---------------------------------------------\n✨ Configuration loaded successfully\n🟢 Enabled features: ${enabledFeatures.join(', ') || 'None'}\n🔴 Disabled features: ${disabledFeatures.join(', ') || 'None'}\n---------------------------------------------`,
    'Config',
  );

  // Display the startup banner
  logger.log(`\n---------------------------------------------
✅ Church API Service is running!
🌐 Environment: ${nodeEnv.toUpperCase()}
🔗 Running on: http://0.0.0.0:${port} (Internal: ${baseUrl})
📚 API Documentation: ${docsUrl}
🏥 Health Check: http://127.0.0.1:${port}/health
---------------------------------------------
`);
}

bootstrap();
