import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { PaymentService } from './payment.service';
import config from '../config';
import { CronJob } from 'cron';
import { minutesToCronExpression } from '../helpers/util';

@Injectable()
export class PaymentCronService {
  private readonly logger = new Logger(PaymentCronService.name);
  private readonly isEnabled: boolean;
  private readonly cronInterval: number;

  constructor(
    private readonly paymentService: PaymentService,
    private readonly schedulerRegistry: SchedulerRegistry
  ) {
    this.cronInterval = config.payment.syncCronInterval;
    this.isEnabled = this.cronInterval > 0;

    if (this.isEnabled) {
      // this.setupDynamicCronJob();
    } else {
      this.logger.warn(
        '⚠️  Payment sync cron job is disabled (PAYMENT_SYNC_CRON_MINUTES=0)'
      );
    }
  }

  /**
   * Setup dynamic cron job based on environment configuration
   */
  // private setupDynamicCronJob() {
  //   try {
  //     // Convert minutes to cron expression using helper
  //     const { expression: cronExpression, description } =
  //       minutesToCronExpression(this.cronInterval);

  //     this.logger.log(
  //       `✅ Payment sync cron job enabled - will run ${description} (${cronExpression})`
  //     );

  //     const job = new CronJob(cronExpression, () => {
  //       this.handlePaymentSync();
  //     });

  //     this.schedulerRegistry.addCronJob('payment-sync', job);
  //     job.start();
  //   } catch (error) {
  //     this.logger.error(
  //       `❌ Failed to setup payment sync cron job: ${error.message}. Please check PAYMENT_SYNC_CRON_MINUTES value.`
  //     );
  //   }
  // }

  /**
   * Sync pending payments based on configured interval
   */
  async handlePaymentSync() {
    // Skip if cron is disabled
    if (!this.isEnabled) {
      return;
    }

    this.logger.log('Running scheduled payment sync...');

    try {
      const result = await this.paymentService.syncPendingPayments();

      this.logger.log(
        `Scheduled sync completed: ${result.updated} updated, ${result.expired} expired, ${result.failed} failed out of ${result.total} pending payments`
      );

      // Log errors if any
      if (result.errors.length > 0) {
        this.logger.warn(`Sync errors: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      this.logger.error('Error in scheduled payment sync:', error);
    }
  }
}
