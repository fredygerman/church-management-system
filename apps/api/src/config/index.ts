import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from root .env
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
Logger.log(`Environment: ${nodeEnv}`, 'Config');

export default {
  // Server Configuration
  port: parseInt(process.env.API_PORT || process.env.PORT || '3001', 10),
  nodeEnv,
  appUrl:
    process.env.APP_URL || `http://localhost:${process.env.API_PORT || '3001'}`,
  frontendUrl:
    process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000',

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'church_',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },

  get databaseURL() {
    return (
      this.database.url ||
      `postgresql://${this.database.user}:${this.database.password}@${this.database.host}:${this.database.port}/${this.database.name}`
    );
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },

  // JWT Configuration
  jwt: {
    secret:
      process.env.JWT_SECRET ||
      'your-super-secret-jwt-key-change-this-in-production',
    accessTokenExpiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m',
    refreshTokenExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '7d',
  },

  // Session Configuration
  session: {
    secret:
      process.env.SESSION_SECRET ||
      'your-super-secret-session-key-change-this-in-production',
  },

  // Email Configuration
  email: {
    resendApiKey: process.env.RESEND_API_KEY,
    fromAddress:
      process.env.EMAIL_FROM || 'Church <noreply@church.org>',
  },

  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
    uploadPath: process.env.UPLOAD_PATH || './uploads',
  },

  // OAuth Configuration
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL,
    },
  },

  // S3 Configuration
  s3: {
    accessKey: process.env.S3_ACCESS_KEY,
    secretKey: process.env.S3_SECRET_KEY,
    bucketName: process.env.S3_BUCKET_NAME,
    endpoint: process.env.S3_ENDPOINT,
    publicUrl: process.env.S3_PUBLIC_URL,
  },

  // File Upload Configuration
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
  allowedDocumentTypes: (
    process.env.ALLOWED_DOCUMENT_TYPES || 'application/pdf,image/jpeg,image/png'
  )
    .split(',')
    .map(t => t.trim()),
  s3StorageEndpoint: process.env.S3_ENDPOINT,
  s3PublicUrl: process.env.S3_PUBLIC_URL,
  s3BucketName: process.env.S3_BUCKET_NAME,
  s3AccessKeyId: process.env.S3_ACCESS_KEY,
  s3SecretKeyId: process.env.S3_SECRET_KEY,

  // S3 Directory/Prefix Configuration (hardcoded for organization)
  s3Directories: {
    default: 'uploads',
    profileImages: 'profile-images',
    documents: 'documents',
    temp: 'temp',
  },

  // SMS Configuration
  sms: {
    apiUrl: process.env.SMS_API_URL,
    username: process.env.SMS_API_USERNAME,
    password: process.env.SMS_API_PASSWORD,
    senderId: process.env.SMS_SENDER_ID,
  },

  // Payment Configuration - ZenoPay
  payment: {
    zeno: {
      apiKey: process.env.ZENO_API_KEY,
      baseUrl: process.env.ZENO_BASE_URL || 'https://zenoapi.com',
      webhookUrl: process.env.ZENO_WEBHOOK_URL,
      webhookSecret: process.env.ZENO_WEBHOOK_SECRET,
    },
    // Cron job for syncing pending payments (in minutes)
    // Default: 5 minutes. Set to 0 to disable
    syncCronInterval: parseInt(
      process.env.PAYMENT_SYNC_CRON_MINUTES || '5',
      10
    ),
  },

  // CORS Configuration
  corsOrigins: process.env.CORS_ORIGINS?.split(',').map(url => url.trim()) || [
    'http://localhost:3000',
    'http://localhost:3005',
  ],

  // Feature Flags
  autoMigrate: process.env.AUTO_MIGRATE === 'true',
  dockerEnv: process.env.DOCKER_ENV === 'true',
};
