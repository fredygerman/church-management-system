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

    // Extract churchId from query params, body, or user's default church
    // Support both church_id and churchId
    const churchIdFromQuery = (request.query.churchId || request.query.church_id) as string
    const churchIdFromBody = request.body?.churchId
    const churchIdFromUser = request.user?.churchId

    // Priority: query params > body > user's default church
    const churchId = churchIdFromQuery || churchIdFromBody || churchIdFromUser

    if (!churchId) {
      throw new BadRequestException('Church context is required. Provide churchId in query or body.')
    }

    // Super admin can access any church
    if (request.user?.role === 'super_admin') {
      request.churchId = churchId
      return true
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
