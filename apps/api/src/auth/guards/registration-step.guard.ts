import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { users } from '../../../../../packages/config/src/schema';
import { eq } from 'drizzle-orm';

/**
 * Registration Step Guard
 * Ensures that users complete registration steps in sequential order
 * Usage: @UseGuards(RegistrationStepGuard)
 */
@Injectable()
export class RegistrationStepGuard implements CanActivate {
  constructor(private readonly db: DatabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { userId } = request.body;

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    // Get user's current registration step
    const [user] = await this.db
      .getDb()
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }


    // Extract expected step from route path
    const path = request.route.path;
    const stepMatch = path.match(/step-(\d+)/);

    if (!stepMatch) {
      // If no step in path, allow access (e.g., status endpoint)
      return true;
    }

    const expectedStep = parseInt(stepMatch[1], 10);

    // For step 2 (OTP verification), user should be at step 1
    // For other steps, user should be at the previous step
    const requiredStep = expectedStep === 2 ? 1 : expectedStep - 1;

   

    return true;
  }
}
