import { Injectable, Logger } from '@nestjs/common';
import config from '../config';
import { getServiceStatus } from './util';
import * as os from 'os';

@Injectable()
export class ServiceStatusUtil {
  private readonly logger = new Logger(ServiceStatusUtil.name);
  private readonly startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  getStatus() {
    const { enabledFeatures, disabledFeatures } = getServiceStatus();

    try {
      const status = {
        app: {
          name: 'Church API',
          version: process.env.npm_package_version || '1.0.0',
          environment: config.nodeEnv,
          uptime: this.getFormattedUptime(),
          startTime: new Date(this.startTime).toISOString(),
        },
        system: {
          platform: process.platform,
          arch: process.arch,
          nodeVersion: process.version,
          cpus: os.cpus().length,
          memory: {
            total: `${Math.round(os.totalmem() / (1024 * 1024 * 1024))} GB`,
            free: `${Math.round(os.freemem() / (1024 * 1024 * 1024))} GB`,
            usage: `${Math.round((1 - os.freemem() / os.totalmem()) * 100)}%`,
          },
          loadAvg: os.loadavg(),
        },
        features: {
          database: {
            enabled: !!config.databaseURL,
            url: config.databaseURL
              ? `${config.databaseURL.split('://')[0]}://${config.databaseURL.split('://')[1].split('@')[1].split('/')[0]}/**`
              : 'not configured',
          },
          redis: {
            enabled: !!(config.redis.url || config.redis.host),
            host: config.redis.host || 'not configured',
            port: config.redis.port || 'not configured',
          },
          oauth: {
            google: {
              enabled: !!(
                config.oauth.google.clientId &&
                config.oauth.google.clientSecret &&
                config.oauth.google.callbackUrl &&
                !config.oauth.google.clientId.includes('your-')
              ),
              callbackUrl: config.oauth.google.callbackUrl || 'not configured',
            },
          },
          s3Storage: {
            enabled: !!(
              config.s3.accessKey &&
              config.s3.secretKey &&
              config.s3.bucketName &&
              !config.s3.accessKey.includes('your-')
            ),
            endpoint: config.s3.endpoint || 'not configured',
            bucket: config.s3.bucketName || 'not configured',
          },
          smsService: {
            enabled: !!(
              config.sms.apiUrl &&
              config.sms.username &&
              config.sms.password &&
              config.sms.senderId
            ),
            url: config.sms.apiUrl || 'not configured',
            senderId: config.sms.senderId || 'not configured',
          },
          email: {
            enabled: !!(
              config.email.resendApiKey &&
              !config.email.resendApiKey.includes('your-')
            ),
            from: config.email.fromAddress || 'not configured',
          },
        },
        summary: {
          enabledFeatures,
          disabledFeatures,
        },
      };

      this.logger.log('Service status generated successfully');
      return status;
    } catch (error) {
      this.logger.error(`Error generating service status: ${error.message}`);
      // Return a simplified status when system info is unavailable
      return {
        app: {
          name: 'Church API',
          version: process.env.npm_package_version || '1.0.0',
          environment: config.nodeEnv,
          uptime: this.getFormattedUptime(),
          startTime: new Date(this.startTime).toISOString(),
        },
        features: {
          database: {
            enabled: !!config.databaseURL,
            url: config.databaseURL
              ? `${config.databaseURL.split('://')[0]}://${config.databaseURL.split('://')[1].split('@')[1].split('/')[0]}/**`
              : 'not configured',
          },
          oauth: {
            google: {
              enabled: !!(
                config.oauth.google.clientId &&
                config.oauth.google.clientSecret &&
                config.oauth.google.callbackUrl &&
                !config.oauth.google.clientId.includes('your-')
              ),
              callbackUrl: config.oauth.google.callbackUrl || 'not configured',
            },
          },
          s3Storage: {
            enabled: !!(
              config.s3.accessKey &&
              config.s3.secretKey &&
              config.s3.bucketName &&
              !config.s3.accessKey.includes('your-')
            ),
            endpoint: config.s3.endpoint || 'not configured',
            bucket: config.s3.bucketName || 'not configured',
          },
          smsService: {
            enabled: !!(
              config.sms.apiUrl &&
              config.sms.username &&
              config.sms.password &&
              config.sms.senderId
            ),
            url: config.sms.apiUrl || 'not configured',
            senderId: config.sms.senderId || 'not configured',
          },
          email: {
            enabled: !!(
              config.email.resendApiKey &&
              !config.email.resendApiKey.includes('your-')
            ),
            from: config.email.fromAddress || 'not configured',
          },
        },
        summary: {
          enabledFeatures,
          disabledFeatures,
        },
      };
    }
  }

  private getFormattedUptime(): string {
    const uptimeMs = Date.now() - this.startTime;
    const seconds = Math.floor(uptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    return days > 0
      ? `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`
      : hours > 0
        ? `${hours}h ${minutes % 60}m ${seconds % 60}s`
        : minutes > 0
          ? `${minutes}m ${seconds % 60}s`
          : `${seconds}s`;
  }
}
