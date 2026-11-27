import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Keys join attempts by signed-in user, so one account cannot brute-force codes by
 * rotating IPs. The global IP guard still applies on top of this.
 */
@Injectable()
export class JoinThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return `join-user:${req.user?.id ?? req.ip}`;
  }
}
