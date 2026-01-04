import config from '../config';

/**
 * Cleans and normalizes an email address
 * @param email The email address to clean
 * @returns Cleaned email address in lowercase
 */
export const cleanEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

/**
 * Removes all non-digit characters from a phone number
 * @param phone The phone number to clean
 * @returns Phone number with only digits
 */
export const cleanPhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

export interface ServiceStatus {
  enabledFeatures: string[];
  disabledFeatures: string[];
}

/**
 * Gets the status of various services and features
 * @returns Object containing enabled and disabled features
 */
export function getServiceStatus(): ServiceStatus {
  const enabledFeatures: string[] = [];
  const disabledFeatures: string[] = [];

  // Check database connectivity
  if (config.databaseURL) {
    enabledFeatures.push('Database');
  } else {
    disabledFeatures.push('Database');
  }

  // Check Redis connectivity
  if (config.redis.url) {
    enabledFeatures.push('Redis Cache');
  } else {
    disabledFeatures.push('Redis Cache');
  }

  // Check email service
  if (
    config.email.resendApiKey &&
    !config.email.resendApiKey.includes('your-')
  ) {
    enabledFeatures.push('Email Service');
  } else {
    disabledFeatures.push('Email Service');
  }

  // Check OAuth services
  const googleConfigured =
    config.oauth.google.clientId &&
    config.oauth.google.clientSecret &&
    !config.oauth.google.clientId.includes('your-');

  if (googleConfigured) {
    enabledFeatures.push('Google OAuth');
  } else {
    disabledFeatures.push('Google OAuth');
  }

  // Check JWT configuration
  if (config.jwt.secret && !config.jwt.secret.includes('default')) {
    enabledFeatures.push('JWT Authentication');
  } else {
    enabledFeatures.push('JWT Authentication (Default Config)');
  }

  // Check S3 Storage
  const s3Configured =
    config.s3.accessKey &&
    config.s3.secretKey &&
    config.s3.bucketName &&
    config.s3.endpoint &&
    !config.s3.accessKey.includes('your-');

  if (s3Configured) {
    enabledFeatures.push('S3 Storage');
  } else {
    disabledFeatures.push('S3 Storage');
  }

  // Check SMS Service
  if (
    config.sms.apiUrl &&
    config.sms.username &&
    config.sms.password &&
    config.sms.senderId
  ) {
    enabledFeatures.push('SMS Service');
  } else {
    disabledFeatures.push('SMS Service');
  }

  // Check Payment Service (ZenoPay)
  if (config.payment?.zeno?.apiKey) {
    enabledFeatures.push('Payment Service (ZenoPay)');
  } else {
    disabledFeatures.push('Payment Service (ZenoPay)');
  }

  // Check file upload configuration
  if (config.upload.uploadPath) {
    enabledFeatures.push('File Upload');
  } else {
    disabledFeatures.push('File Upload');
  }

  // Auto migration status
  if (config.autoMigrate) {
    enabledFeatures.push('Auto Migration');
  } else {
    disabledFeatures.push('Auto Migration');
  }

  return {
    enabledFeatures,
    disabledFeatures,
  };
}

/**
 * Validates environment configuration
 * @returns boolean indicating if configuration is valid
 */
export function validateConfiguration(): boolean {
  const required = ['port', 'nodeEnv', 'jwt.secret'];

  for (const key of required) {
    const value = getNestedProperty(config, key);
    if (!value) {
      throw new Error(`Missing required configuration: ${key}`);
    }
  }

  return true;
}

/**
 * Gets a nested property from an object using dot notation
 * @param obj The object to get the property from
 * @param path The dot-notated path to the property
 * @returns The value at the specified path
 */
function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Formats a configuration value for logging
 * @param value The value to format
 * @returns Formatted string
 */
export function formatConfigValue(value: any): string {
  if (
    typeof value === 'string' &&
    (value.includes('secret') || value.includes('key'))
  ) {
    return '[REDACTED]';
  }

  if (typeof value === 'string' && value.length > 50) {
    return `${value.substring(0, 47)}...`;
  }

  return String(value);
}

/**
 * Checks if the application is running in a production environment
 * @returns boolean indicating if environment is production
 */
export function isProduction(): boolean {
  return config.nodeEnv === 'production';
}

/**
 * Checks if the application is running in a development environment
 * @returns boolean indicating if environment is development
 */
export function isDevelopment(): boolean {
  return config.nodeEnv === 'development' || config.nodeEnv === 'local';
}

/**
 * Gets the full API base URL
 * @returns The complete API base URL
 */
export function getApiBaseUrl(): string {
  return `${config.appUrl}/api`;
}

/**
 * Gets health check information
 * @returns Object containing health status
 */
export function getHealthInfo() {
  const { enabledFeatures, disabledFeatures } = getServiceStatus();

  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    version: process.env.npm_package_version || '1.0.0',
    node: process.version,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    features: {
      enabled: enabledFeatures,
      disabled: disabledFeatures,
    },
  };
}

/**
 * Converts minutes to a valid cron expression
 * Handles different intervals intelligently:
 * - 1-59 minutes: Uses minute-based cron (0 *\/X * * * *)
 * - 60-1439 minutes (1-23 hours): Uses hour-based cron (0 0 *\/X * * *)
 * - 1440+ minutes (1+ days): Uses day-based cron (0 0 0 *\/X * *)
 *
 * @param minutes The interval in minutes
 * @returns Cron expression string
 * @throws Error if minutes is invalid
 */
export function minutesToCronExpression(minutes: number): {
  expression: string;
  description: string;
} {
  if (!Number.isInteger(minutes) || minutes < 1) {
    throw new Error('Minutes must be a positive integer');
  }

  // Less than 1 hour: use minute-based cron
  if (minutes < 60) {
    return {
      expression: `0 */${minutes} * * * *`,
      description: `every ${minutes} minute${minutes > 1 ? 's' : ''}`,
    };
  }

  // 1-23 hours: use hour-based cron
  if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      // Exact hours (e.g., 60, 120, 180 minutes)
      return {
        expression: `0 0 */${hours} * * *`,
        description: `every ${hours} hour${hours > 1 ? 's' : ''}`,
      };
    } else {
      // Mixed hours and minutes (e.g., 90 minutes = 1h 30m)
      // Run at specific minute of each hour interval
      return {
        expression: `${remainingMinutes} */${hours} * * *`,
        description: `every ${hours} hour${hours > 1 ? 's' : ''} and ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`,
      };
    }
  }

  // 1+ days: use day-based cron
  const days = Math.floor(minutes / 1440);
  const remainingHours = Math.floor((minutes % 1440) / 60);
  const remainingMinutes = minutes % 60;

  if (remainingHours === 0 && remainingMinutes === 0) {
    // Exact days (e.g., 1440, 2880 minutes)
    return {
      expression: `0 0 0 */${days} * *`,
      description: `every ${days} day${days > 1 ? 's' : ''}`,
    };
  } else {
    // Mixed days, hours, and minutes
    // Run at specific time each day interval
    return {
      expression: `${remainingMinutes} ${remainingHours} */${days} * *`,
      description: `every ${days} day${days > 1 ? 's' : ''} at ${String(remainingHours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}`,
    };
  }
}
