import { api } from "./api"

// The API clamps every member list to 100 rows (apps/api members-list.ts MEMBER_LIST_MAX_LIMIT),
// so a full list is read page by page with offset.
export const MEMBER_PAGE_SIZE = 100

// Upper bound on sequential requests: 50 pages is 5,000 members. Past it the result is marked truncated, not looped on.
const MAX_PAGES = 50

export type MemberListResult<T> = {
  rows: T[]
  // Total reported by the API. Falls back to the number of rows read when the API reports none.
  total: number
  // True only when rows were left unread: the page cap was hit, or the API reported more than it returned.
  truncated: boolean
}

// Reads every page of GET /members in order. The ordering has an id tie-break on the server, so offsets are stable.
export async function fetchAllMembers<T>(): Promise<MemberListResult<T>> {
  const rows: T[] = []
  let total: number | null = null
  let finished = false
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, meta } = await api.getPage<unknown>(`/members?limit=${MEMBER_PAGE_SIZE}&offset=${rows.length}`)
    const batch = Array.isArray(data) ? (data as T[]) : []
    rows.push(...batch)
    if (typeof meta?.total === "number") total = meta.total
    const reachedTotal = total !== null && rows.length >= total
    const shortPage = total === null && batch.length < MEMBER_PAGE_SIZE
    if (batch.length === 0 || reachedTotal || shortPage) {
      finished = true
      break
    }
  }
  return {
    rows,
    total: total ?? rows.length,
    truncated: !finished || (total !== null && rows.length < total),
  }
}
