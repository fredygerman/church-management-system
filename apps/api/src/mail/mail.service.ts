import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import config from '../config';
import WelcomeEmail from './templates/welcome';
import PasswordResetEmail from './templates/password-reset';
import OrderConfirmationEmail from './templates/order-confirmation';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend | null = null;
  private readonly isConfigured: boolean;

  constructor() {
    this.isConfigured =
      !!config.email.resendApiKey &&
      !config.email.resendApiKey.includes('your-');

    if (this.isConfigured) {
      this.resend = new Resend(config.email.resendApiKey);
      this.logger.log('✅ Resend email service initialized');
    } else {
      this.logger.warn(
        '⚠️ Resend API key not configured - email service disabled'
      );
    }
  }

  async sendEmail(
    options: EmailOptions
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isConfigured || !this.resend) {
      this.logger.warn('Email service not configured, skipping email send');
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    try {
      // Ensure at least text or html is provided
      const emailData: any = {
        from: options.from || config.email.fromAddress,
        to: options.to,
        subject: options.subject,
      };

      if (options.html) {
        emailData.html = options.html;
      }

      if (options.text) {
        emailData.text = options.text;
      }

      // If neither html nor text is provided, create a text version
      if (!options.html && !options.text) {
        emailData.text = options.subject;
      }

      const { data, error } = await this.resend.emails.send(emailData);

      if (error) {
        this.logger.error('Failed to send email:', error);
        return {
          success: false,
          error: error.message || 'Failed to send email',
        };
      }

      if (data?.id) {
        this.logger.log(
          `✅ Email sent successfully to ${options.to}, ID: ${data.id}`
        );
        return {
          success: true,
          messageId: data.id,
        };
      }

      return {
        success: false,
        error: 'Email sent but no response data received',
      };
    } catch (error) {
      this.logger.error('Email sending failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async sendWelcomeEmail(
    to: string,
    name: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const html = await render(
        WelcomeEmail({
          userFirstName: name,
          dashboardUrl: `${config.frontendUrl || 'http://localhost:3000'}/dashboard`,
        })
      );

      return this.sendEmail({
        to,
        subject: 'Welcome to Church!',
        html,
      });
    } catch (error) {
      this.logger.error('Failed to render welcome email template:', error);
      return {
        success: false,
        error: 'Failed to render email template',
      };
    }
  }

  async sendPasswordResetEmail(
    to: string,
    name: string,
    resetUrl: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const html = await render(
        PasswordResetEmail({
          userFirstName: name,
          resetUrl,
        })
      );

      return this.sendEmail({
        to,
        subject: 'Password Reset - Church',
        html,
      });
    } catch (error) {
      this.logger.error(
        'Failed to render password reset email template:',
        error
      );
      return {
        success: false,
        error: 'Failed to render email template',
      };
    }
  }

  async sendOrderConfirmationEmail(
    to: string,
    name: string,
    trackingNumber: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const trackingUrl = `${config.frontendUrl || 'http://localhost:3000'}/track/${trackingNumber}`;
      const html = await render(
        OrderConfirmationEmail({
          userFirstName: name,
          trackingNumber,
          trackingUrl,
        })
      );

      return this.sendEmail({
        to,
        subject: `Order Confirmed - Tracking #${trackingNumber}`,
        html,
      });
    } catch (error) {
      this.logger.error(
        'Failed to render order confirmation email template:',
        error
      );
      return {
        success: false,
        error: 'Failed to render email template',
      };
    }
  }

  getServiceStatus(): { configured: boolean; provider: string } {
    return {
      configured: this.isConfigured,
      provider: 'Resend',
    };
  }
}
