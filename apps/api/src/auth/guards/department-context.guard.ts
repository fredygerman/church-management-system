import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Request } from 'express'
import { UserContext, UserRole } from '../types/permission.types'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'
import { MembersService } from '../../members/members.service'
import { DepartmentsService } from '../../departments/departments.service'

@Injectable()
export class DepartmentContextGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private membersService: MembersService,
    private departmentsService: DepartmentsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) {
      return true
    }

    const request = context.switchToHttp().getRequest<Request>()
    const user = request.user as UserContext

    if (!user) {
      throw new ForbiddenException('User context not found')
    }

    // Only enforce department context for department leaders
    if (user.role !== UserRole.DEPARTMENT_LEADER) {
      return true
    }

    // Resolve the member behind this user, and the departments they lead,
    // with a live DB query every request (no stored/JWT field - avoids drift).
    const churchId = request['churchId'] as string
    const member = await this.membersService.getMemberByUserId(churchId, user.id)
    const ledDepartmentIds = member
      ? await this.departmentsService.getLedDepartmentIds(churchId, member.id)
      : []

    // Get departmentId from:
    // 1. Request params (/departments/:id, /departments/:id/members, ...)
    // 2. Query string (?departmentId=xxx)
    // 3. Request body (POST/PUT)
    const departmentIdFromParams = request.params.id
    const departmentIdFromQuery = request.query.departmentId
    const departmentIdFromBody = (request.body as any)?.departmentId

    const requestedDepartmentId =
      departmentIdFromParams || departmentIdFromQuery || departmentIdFromBody

    // No departmentId specified: auto-inject if the leader leads exactly one
    // department; otherwise pass through unmodified (list-scoping is the
    // service/controller layer's responsibility).
    if (!requestedDepartmentId) {
      if (ledDepartmentIds.length === 1) {
        if (request.params) {
          request.params.id = ledDepartmentIds[0]
        }
        if (!request.query) {
          request.query = {}
        }
        request.query.departmentId = ledDepartmentIds[0]
      }
      return true
    }

    // Verify leader is accessing only a department they lead
    if (!ledDepartmentIds.includes(requestedDepartmentId as string)) {
      throw new ForbiddenException(
        'You can only access members from your assigned department'
      )
    }

    return true
  }
}
