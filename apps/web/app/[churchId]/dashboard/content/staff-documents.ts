import { apiRequest } from "@/lib/api-client"

export interface StaffDocument {
  id: string
  title: string
  description: string | null
  originalFileName: string
  contentType: string
  sizeBytes: number
  visibleToMembers: boolean
  createdAt: string
}

export type StaffDocumentsResult =
  | { status: "ok"; documents: StaffDocument[] }
  | { status: "error"; message: string }
  | { status: "unavailable"; message: string }

const ERROR_MESSAGE = "Documents could not be loaded. Please try again."
const UNAVAILABLE_MESSAGE =
  "Documents are unavailable right now because the server could not be reached."

function isNextRedirect(error: unknown): boolean {
  return error instanceof Error && error.message.includes("NEXT_REDIRECT")
}

// Staff document list: GET /api/files/user, which requires manage:files.
// The API returns non-visible documents too; this page only lists them.
export async function getStaffDocuments(
  churchId: string
): Promise<StaffDocumentsResult> {
  try {
    const response = await apiRequest<StaffDocument[]>({
      requestConfig: {
        method: "GET",
        url: "/api/files/user",
        params: { churchId },
      },
    })

    // statusCode 0 means apiRequest could not reach the server at all.
    if (!response.success && response.statusCode === 0) {
      return { status: "unavailable", message: UNAVAILABLE_MESSAGE }
    }

    if (!response.success) {
      return { status: "error", message: ERROR_MESSAGE }
    }

    if (!Array.isArray(response.data)) {
      return {
        status: "unavailable",
        message: "Documents returned an unexpected response.",
      }
    }

    return { status: "ok", documents: response.data }
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error
    }

    console.error("Error fetching staff documents:", error)
    return { status: "unavailable", message: UNAVAILABLE_MESSAGE }
  }
}
