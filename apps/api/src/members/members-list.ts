import { BadRequestException } from '@nestjs/common'
import { parsePagination } from '../helpers/pagination.helper'

export const MEMBER_LIST_MAX_LIMIT = 100

// Whitelist: the client-facing sort key maps to a Drizzle column property name.
// Raw column names from the client are never interpolated into SQL.
export const MEMBER_SORTS = {
  'created_at.desc': { column: 'createdAt', direction: 'desc' },
  'created_at.asc': { column: 'createdAt', direction: 'asc' },
  'updated_at.desc': { column: 'updatedAt', direction: 'desc' },
  'updated_at.asc': { column: 'updatedAt', direction: 'asc' },
} as const

export type MemberSortKey = keyof typeof MEMBER_SORTS
export type MemberSort = (typeof MEMBER_SORTS)[MemberSortKey]

const GENDERS = ['male', 'female', 'others'] as const
const MARITAL_STATUSES = ['single', 'married', 'divorced', 'widowed'] as const

export interface MemberListQuery {
  firstName?: string
  lastName?: string
  occupation?: string
  gender?: (typeof GENDERS)[number]
  maritalStatus?: (typeof MARITAL_STATUSES)[number]
  sort: MemberSortKey
  limit: number
  offset: number
}

export interface MemberListMeta {
  total: number
  page: number
  limit: number
  total_pages: number
}

const readString = (raw: unknown, name: string): string | undefined => {
  if (raw === undefined) return undefined
  if (typeof raw !== 'string') throw new BadRequestException(`${name} must be a single value`)
  const value = raw.trim()
  return value === '' ? undefined : value
}

const readEnum = <T extends readonly string[]>(
  raw: unknown,
  name: string,
  allowed: T,
): T[number] | undefined => {
  const value = readString(raw, name)
  if (value === undefined) return undefined
  if (!(allowed as readonly string[]).includes(value)) {
    throw new BadRequestException(`${name} must be one of: ${allowed.join(', ')}`)
  }
  return value as T[number]
}

/**
 * Parses the query string of GET /members. Only the params the web client sends
 * are supported: firstName, lastName, occupation, gender, maritalStatus, sort,
 * limit, offset. `from`/`to` are rejected explicitly rather than silently ignored.
 */
export function parseMemberListQuery(query: Record<string, unknown>): MemberListQuery {
  if (query.from !== undefined || query.to !== undefined) {
    throw new BadRequestException('from and to filters are not supported on /members')
  }

  const rawSort = readString(query.sort, 'sort') ?? 'created_at.desc'
  if (!Object.prototype.hasOwnProperty.call(MEMBER_SORTS, rawSort)) {
    throw new BadRequestException(`sort must be one of: ${Object.keys(MEMBER_SORTS).join(', ')}`)
  }

  const { limit: rawLimit, offset: rawOffset } = parsePagination(
    readString(query.limit, 'limit'),
    readString(query.offset, 'offset'),
  )

  return {
    firstName: readString(query.firstName, 'firstName'),
    lastName: readString(query.lastName, 'lastName'),
    occupation: readString(query.occupation, 'occupation'),
    gender: readEnum(query.gender, 'gender', GENDERS),
    maritalStatus: readEnum(query.maritalStatus, 'maritalStatus', MARITAL_STATUSES),
    sort: rawSort as MemberSortKey,
    limit: Math.min(rawLimit ?? MEMBER_LIST_MAX_LIMIT, MEMBER_LIST_MAX_LIMIT),
    offset: rawOffset ?? 0,
  }
}

export function computeTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit)
}

export function buildMemberListMeta(total: number, query: Pick<MemberListQuery, 'limit' | 'offset'>): MemberListMeta {
  return {
    total,
    page: Math.floor(query.offset / query.limit) + 1,
    limit: query.limit,
    total_pages: computeTotalPages(total, query.limit),
  }
}
