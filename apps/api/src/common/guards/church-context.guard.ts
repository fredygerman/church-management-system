import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common'
import { Request } from 'express'

interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
    churchId?: string
  }
  churchId?: string
}

@Injectable()
export class ChurchContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()

    // Extract church_id from query params, body, or user's default church
    const churchIdFromQuery = request.query.church_id as string
    const churchIdFromBody = request.body?.churchId as string
    const churchIdFromUser = request.user?.churchId

    // Priority: query params > body > user's default church
    const churchId = churchIdFromQuery || churchIdFromBody || churchIdFromUser

    if (!churchId) {
      throw new BadRequestException('Church context is required. Provide church_id in query or body.')
    }

    // If user is a branch admin, they can only access their own church
    if (request.user?.role === 'branch_admin' && request.user.churchId !== churchId) {
      throw new BadRequestException('You can only access your assigned church.')
    }

    // Store churchId in request for use in services
    request.churchId = churchId

    return true
  }
}
