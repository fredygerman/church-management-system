// Staff check-in calls and outcome mapping. The API decides every outcome; this file only names it.
import { ApiError, api } from "./api"

export type CheckinOutcome = "success" | "duplicate" | "forbidden" | "not-found" | "closed" | "invalid" | "unavailable"

/** Maps a failed check-in request to a user-facing outcome. Status codes come from the API; 400 text separates duplicate and closed. */
export function classifyCheckinError(caught: unknown): CheckinOutcome {
  if (!(caught instanceof ApiError)) return "unavailable"
  if (caught.status === 403) return "forbidden"
  if (caught.status === 404) return "not-found"
  if (caught.status === 400) {
    if (/already checked in/i.test(caught.message)) return "duplicate"
    if (/must be open/i.test(caught.message)) return "closed"
    return "invalid"
  }
  return "unavailable"
}

export async function submitManualCheckin(sessionId: string, memberId: string): Promise<CheckinOutcome> {
  try {
    await api.post(`/attendance/sessions/${encodeURIComponent(sessionId)}/checkins/manual`, { memberId })
    return "success"
  } catch (caught) {
    return classifyCheckinError(caught)
  }
}

export async function submitQrCheckin(token: string, memberId: string): Promise<CheckinOutcome> {
  try {
    await api.post(`/attendance/checkins/qr/${encodeURIComponent(token)}`, { memberId })
    return "success"
  } catch (caught) {
    return classifyCheckinError(caught)
  }
}
