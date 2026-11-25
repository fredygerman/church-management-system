import { Injectable } from '@nestjs/common'
import { roleHasPermission, type PermissionAction } from '../auth/types/permission.types'
import { MembersService } from '../members/members.service'
import { EventsService } from '../events/events.service'
import { FileUploadService } from '../file-upload/file-upload.service'
import { AttendanceService } from '../attendance/attendance.service'

/** The signed-in caller. Every tool runs with this caller's church and role only. */
export interface AiCaller {
  userId: string
  role: string
  churchId: string
}

export interface AiReadTool {
  name: string
  description: string
  /** Human-readable data source name, shown to the user as an answer source. */
  source: string
  permission: PermissionAction
  run(caller: AiCaller): Promise<unknown>
}

export type AiToolResult =
  | { ok: true; content: string; source: string }
  | { ok: false; denied: boolean; content: string }

/**
 * Read-only data tools for the AI assistant. Deliberately excludes prayer
 * requests, families, giving and visitors (DEC-02, DEC-08). Adding a write
 * tool is out of scope.
 */
@Injectable()
export class AiReadTools {
  private readonly tools: AiReadTool[]

  constructor(
    private readonly members: MembersService,
    private readonly events: EventsService,
    private readonly files: FileUploadService,
    private readonly attendance: AttendanceService,
  ) {
    this.tools = [
      {
        name: 'member_count',
        description: 'Total number of active members the caller can see in their church (zone and department leaders: only their own members).',
        source: 'Member records',
        permission: 'read:member',
        run: async ({ churchId, userId, role }) => {
          const scope = await this.members.getLeaderScope(churchId, userId, role)
          const { total } = await this.members.listMembers(
            churchId,
            { sort: 'created_at.desc', limit: 1, offset: 0 },
            scope?.memberFilter,
          )
          return { total_members: total }
        },
      },
      {
        name: 'upcoming_events',
        description: 'Up to 10 upcoming published events the caller can see (title, start time, location).',
        source: 'Events',
        permission: 'view:events',
        run: async ({ churchId }) => {
          const events = await this.events.getEventsByChurch(
            churchId,
            { from: new Date().toISOString() },
            true,
            10,
            0,
          )
          return events.map((e) => ({
            title: e.title,
            starts_at: e.startsAt,
            location: e.location ?? null,
          }))
        },
      },
      {
        name: 'library_documents',
        description: 'Up to 20 member-visible library documents (title, description, type, date). Same rules as GET /api/files/library.',
        source: 'Library documents',
        permission: 'read:self',
        run: async ({ churchId }) => {
          const docs = await this.files.getMemberLibrary(churchId)
          return docs.slice(0, 20).map((d) => ({
            title: d.title,
            description: d.description ?? null,
            content_type: d.content_type,
            created_at: d.created_at,
          }))
        },
      },
      {
        name: 'service_types',
        description: 'Service types configured for the church (name, active flag).',
        source: 'Service types',
        permission: 'view:attendance',
        run: async ({ churchId }) => {
          const types = await this.attendance.listServiceTypes(churchId)
          return types.map((t) => ({ name: t.name, is_active: t.isActive }))
        },
      },
    ]
  }

  /** Tool definitions advertised to the model. */
  definitions(): { name: string; description: string }[] {
    return this.tools.map(({ name, description }) => ({ name, description }))
  }

  /**
   * Runs a tool for the caller. The permission is re-checked here, server side,
   * so a denied call never reaches a service.
   */
  async execute(name: string, caller: AiCaller): Promise<AiToolResult> {
    const tool = this.tools.find((t) => t.name === name)
    if (!tool) {
      return { ok: false, denied: false, content: JSON.stringify({ error: 'unknown_tool' }) }
    }
    if (!roleHasPermission(caller.role as any, tool.permission)) {
      return {
        ok: false,
        denied: true,
        content: JSON.stringify({
          error: 'permission_denied',
          message: 'The caller may not read this data. Answer with a notice.',
        }),
      }
    }
    const data = await tool.run(caller)
    return { ok: true, content: JSON.stringify(data), source: tool.source }
  }
}
