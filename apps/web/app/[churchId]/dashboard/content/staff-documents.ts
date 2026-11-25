import { apiRequest } from "@/lib/api-client"
import { getTranslator } from "@/lib/i18n/server"

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


function isNextRedirect(error: unknown): boolean {
  return error instanceof Error && error.message.includes("NEXT_REDIRECT")
}

// Staff document list: GET /api/files/user, which requires manage:files.
// The API returns non-visible documents too; this page only lists them.
export async function getStaffDocuments(
  churchId: string
): Promise<StaffDocumentsResult> {
  const t = await getTranslator()
  const ERROR_MESSAGE = t("final.staffDocs.loadFailed")
  const UNAVAILABLE_MESSAGE = t("final.staffDocs.unavailable")
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
        message: t("final.staffDocs.unexpected"),
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
