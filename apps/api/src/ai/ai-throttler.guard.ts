import { Injectable } from '@nestjs/common'
import { ThrottlerGuard } from '@nestjs/throttler'

/** Keys the AI chat rate limit by signed-in user instead of IP. */
@Injectable()
export class AiUserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return `ai-user:${req.user?.id ?? req.ip}`
  }
}
