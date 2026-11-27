"use client"

import { useState, type FormEvent } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { useT } from "@/components/i18n/locale-provider"
import { formatLocaleDate } from "@church/config"

import {
  createInvitation,
  decideMembershipRequest,
  listInvitations,
  listPendingRequests,
  revokeInvitation,
  type InvitationActionError,
  type InvitationActionResult,
} from "./actions"
import {
  MAX_USES_RANGE,
  VALID_DAYS_RANGE,
  getCodeStatus,
  requestContactLine,
  validateCodeSettings,
  type CreatedInvitationCode,
  type InvitationCode,
  type MembershipRequest,
} from "./invitation-helpers"

interface InvitationsManagerProps {
  churchId: string
  initialCodes: InvitationActionResult<InvitationCode[]>
  initialRequests: InvitationActionResult<MembershipRequest[]>
}

export function InvitationsManager({ churchId, initialCodes, initialRequests }: InvitationsManagerProps) {
  const { t, locale } = useT()

  const [codes, setCodes] = useState(initialCodes)
  const [requests, setRequests] = useState(initialRequests)
  const [maxUses, setMaxUses] = useState(String(MAX_USES_RANGE.default))
  const [validDays, setValidDays] = useState(String(VALID_DAYS_RANGE.default))
  const [created, setCreated] = useState<CreatedInvitationCode | null>(null)
  const [copied, setCopied] = useState(false)
  // Identifies the one request in flight, for example "create" or "approve:<id>".
  const [busy, setBusy] = useState<string | null>(null)

  function errorMessage(error: InvitationActionError): string {
    return t(error === "noPermission" ? "invitations.error.noPermission" : "invitations.error.generic")
  }

  async function refreshCodes() {
    setCodes(await listInvitations(churchId))
  }

  async function refreshRequests() {
    setRequests(await listPendingRequests(churchId))
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // Native min and max on the inputs already block out-of-range values; this check is a second guard.
    const settings = validateCodeSettings({ maxUses, validDays })
    if (!settings.ok) return

    setBusy("create")
    const result = await createInvitation(churchId, settings)
    setBusy(null)
    if (!result.ok) {
      toast.error(errorMessage(result.error))
      return
    }
    setCreated(result.data)
    setCopied(false)
    await refreshCodes()
  }

  async function handleCopy(code: string) {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
    } catch {
      toast.error(t("invitations.error.generic"))
    }
  }

  async function handleRevoke(invitationId: string) {
    setBusy(`revoke:${invitationId}`)
    const result = await revokeInvitation(churchId, invitationId)
    setBusy(null)
    if (!result.ok) {
      toast.error(errorMessage(result.error))
      return
    }
    await refreshCodes()
  }

  async function handleDecision(membershipId: string, decision: "approve" | "reject") {
    setBusy(`${decision}:${membershipId}`)
    const result = await decideMembershipRequest(churchId, membershipId, decision)
    setBusy(null)
    if (!result.ok) {
      toast.error(errorMessage(result.error))
      return
    }
    toast.success(t(decision === "approve" ? "invitations.approved" : "invitations.declined"))
    await refreshRequests()
  }

  return (
    <div className="flex flex-col space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("invitations.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("invitations.intro")}</p>
      </div>

      <Card>
        <CardContent className="space-y-6 pt-6">
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="invitation-max-uses">{t("invitations.maxUses")}</Label>
              <Input
                id="invitation-max-uses"
                type="number"
                inputMode="numeric"
                min={MAX_USES_RANGE.min}
                max={MAX_USES_RANGE.max}
                required
                value={maxUses}
                onChange={(event) => setMaxUses(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invitation-valid-days">{t("invitations.expiryDays")}</Label>
              <Input
                id="invitation-valid-days"
                type="number"
                inputMode="numeric"
                min={VALID_DAYS_RANGE.min}
                max={VALID_DAYS_RANGE.max}
                required
                value={validDays}
                onChange={(event) => setValidDays(event.target.value)}
              />
            </div>
            <Button type="submit" disabled={busy === "create"}>
              {t("invitations.create")}
            </Button>
          </form>

          {created ? (
            <div role="status" className="space-y-3 rounded-md border p-4">
              <p className="text-sm font-medium">{t("invitations.codeOnce")}</p>
              <div className="flex flex-wrap items-center gap-3">
                <code className="font-mono text-2xl font-semibold tracking-widest">{created.code}</code>
                <Button variant="outline" size="sm" onClick={() => handleCopy(created.code)}>
                  {copied ? t("invitations.copied") : t("invitations.copy")}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("invitations.expires", { date: formatLocaleDate(created.expiresAt, locale) })}
              </p>
            </div>
          ) : null}

          {codes.ok ? (
            codes.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("invitations.list.empty")}</p>
            ) : (
              <Table>
                <TableBody>
                  {codes.data.map((code) => {
                    const status = getCodeStatus(code)
                    return (
                      <TableRow key={code.id}>
                        <TableCell>
                          {t("invitations.expires", { date: formatLocaleDate(code.expiresAt, locale) })}
                        </TableCell>
                        <TableCell>{t("invitations.uses", { used: code.uses, max: code.maxUses })}</TableCell>
                        <TableCell>
                          {status === "active" ? (
                            <Badge variant="secondary">{t("invitations.active")}</Badge>
                          ) : status === "revoked" ? (
                            <Badge variant="outline">{t("invitations.revoked")}</Badge>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right">
                          {status === "active" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={busy === `revoke:${code.id}`}
                              onClick={() => handleRevoke(code.id)}
                            >
                              {t("invitations.revoke")}
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )
          ) : (
            <p role="alert" className="text-sm text-destructive">
              {errorMessage(codes.error)}
            </p>
          )}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t("invitations.pending.heading")}</h2>
        <Card>
          <CardContent className="pt-6">
            {requests.ok ? (
              requests.data.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("invitations.pending.empty")}</p>
              ) : (
                <Table>
                  <TableBody>
                    {requests.data.map((request) => (
                      <TableRow key={request.membershipId}>
                        <TableCell className="font-medium">
                          {request.name}
                          <div className="text-sm font-normal text-muted-foreground">
                            {requestContactLine(request) || "—"}
                          </div>
                        </TableCell>
                        <TableCell>
                          {t("invitations.requestedOn", { date: formatLocaleDate(request.requestedAt, locale) })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              disabled={busy === `approve:${request.membershipId}`}
                              onClick={() => handleDecision(request.membershipId, "approve")}
                            >
                              {t("invitations.approve")}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={busy === `reject:${request.membershipId}`}
                              onClick={() => handleDecision(request.membershipId, "reject")}
                            >
                              {t("invitations.reject")}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            ) : (
              <p role="alert" className="text-sm text-destructive">
                {errorMessage(requests.error)}
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
