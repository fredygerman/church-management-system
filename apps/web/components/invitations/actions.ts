"use server"

import { revalidatePath } from "next/cache"
import { apiRequest } from "@/lib/api-client"
import type {
  CreatedInvitationCode,
  InvitationCode,
  MembershipRequest,
} from "./invitation-helpers"

// Errors are mapped to a fixed key-like code. Raw server text never reaches the page.
export type InvitationActionError = "generic" | "noPermission"

export type InvitationActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: InvitationActionError }

const BASE = "/churches"

function isRedirectSignal(error: unknown): boolean {
  const digest = (error as { digest?: unknown } | null)?.digest
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")
}

async function request<T>(
  method: "GET" | "POST" | "DELETE",
  path: string,
  churchId: string,
  body?: Record<string, unknown>,
): Promise<InvitationActionResult<T>> {
  try {
    // The API reads churchId from the query string (GET, DELETE) or the body (POST).
    const response = await apiRequest<T>({
      requestConfig: {
        method,
        url: `${BASE}${path}`,
        params: method === "POST" ? undefined : { churchId },
        data: method === "POST" ? { ...body, churchId } : undefined,
      },
    })

    // A 204 from DELETE has no JSON body, so the client reports it as unsuccessful. Treat it as done.
    if (method === "DELETE" && response.statusCode === 204) {
      return { ok: true, data: undefined as T }
    }
    if (!response.success) {
      return { ok: false, error: response.statusCode === 403 ? "noPermission" : "generic" }
    }
    return { ok: true, data: response.data as T }
  } catch (error) {
    if (isRedirectSignal(error)) throw error
    console.error(`Invitations request failed: ${method} ${path}`)
    return { ok: false, error: "generic" }
  }
}

export async function listInvitations(
  churchId: string,
): Promise<InvitationActionResult<InvitationCode[]>> {
  const result = await request<{ items: InvitationCode[] }>("GET", "/invitations", churchId)
  return result.ok ? { ok: true, data: result.data?.items ?? [] } : result
}

export async function createInvitation(
  churchId: string,
  settings: { maxUses: number; validDays: number },
): Promise<InvitationActionResult<CreatedInvitationCode>> {
  const result = await request<CreatedInvitationCode>("POST", "/invitations", churchId, {
    maxUses: settings.maxUses,
    validDays: settings.validDays,
  })
  if (result.ok) revalidatePath(`/${churchId}/dashboard/invitations`)
  return result
}

export async function revokeInvitation(
  churchId: string,
  invitationId: string,
): Promise<InvitationActionResult<void>> {
  const result = await request<void>(
    "DELETE",
    `/invitations/${encodeURIComponent(invitationId)}`,
    churchId,
  )
  if (result.ok) revalidatePath(`/${churchId}/dashboard/invitations`)
  return result.ok ? { ok: true, data: undefined } : result
}

export async function listPendingRequests(
  churchId: string,
): Promise<InvitationActionResult<MembershipRequest[]>> {
  const result = await request<{ items: MembershipRequest[] }>(
    "GET",
    "/memberships/pending",
    churchId,
  )
  return result.ok ? { ok: true, data: result.data?.items ?? [] } : result
}

export async function decideMembershipRequest(
  churchId: string,
  membershipId: string,
  decision: "approve" | "reject",
): Promise<InvitationActionResult<void>> {
  const result = await request<void>(
    "POST",
    `/memberships/${encodeURIComponent(membershipId)}/${decision}`,
    churchId,
  )
  if (result.ok) revalidatePath(`/${churchId}/dashboard/invitations`)
  return result.ok ? { ok: true, data: undefined } : result
}
