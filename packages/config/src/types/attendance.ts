/** Shared contract for the first native staff attendance mutation. */
export interface AttendanceCheckinInput {
  memberId: string
}

export type AttendanceCheckinSource = 'manual' | 'qr'

export interface AttendanceCheckinResult {
  id: string
  churchId: string
  sessionId: string
  memberId: string
  source: AttendanceCheckinSource
  createdAt: Date | string | null
}
