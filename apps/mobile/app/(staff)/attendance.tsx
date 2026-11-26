import { useEffect, useRef, useState } from "react"
import { Button, Pressable, ScrollView, Text, TextInput, View } from "react-native"
import type { MessageKey } from "@church/config/i18n"
import { api } from "../../lib/api"
import { submitManualCheckin, submitQrCheckin, type CheckinOutcome } from "../../lib/checkin"
import { createRequestGate } from "../../lib/request-gate"
import { roleHasTabPermission } from "../../lib/claims"
import { useT } from "../../lib/locale"
import { useSession } from "../../lib/session"
import { EmptyState, ErrorState, LoadingState, styles } from "../../components/screen-state"

// Permission: manage:attendance (POST sessions/:id/checkins/manual, POST checkins/qr/:token).
// Reads: GET /attendance/sessions (open ones are offered), GET /members (batch selection).
type Session = { id: string; title: string | null; sessionDate: string; status: string }
type Member = { id: string; firstName?: string | null; lastName?: string | null }
type Result = { key: string; label: string; outcome: CheckinOutcome }

const OUTCOME_KEY: Record<CheckinOutcome, MessageKey> = {
  success: "wiring.checkin.outcome.success",
  duplicate: "wiring.checkin.outcome.duplicate",
  forbidden: "wiring.checkin.outcome.forbidden",
  "not-found": "wiring.checkin.outcome.notFound",
  closed: "wiring.checkin.outcome.closed",
  invalid: "wiring.checkin.outcome.invalid",
  unavailable: "wiring.checkin.outcome.unavailable",
}

export default function AttendanceScreen() {
  const { t } = useT()
  const { user, contextKey } = useSession()
  const allowed = roleHasTabPermission(user?.activeRole ?? undefined, "manage:attendance")
  const gate = useRef(createRequestGate()).current
  // Latest context, read after awaits so a batch started under one church never reports into another.
  const contextRef = useRef(contextKey)
  useEffect(() => { contextRef.current = contextKey }, [contextKey])

  const [attempt, setAttempt] = useState(0)
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading")
  const [sessions, setSessions] = useState<Session[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [memberId, setMemberId] = useState("")
  const [token, setToken] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [results, setResults] = useState<Result[]>([])
  const [summary, setSummary] = useState("")
  const [notice, setNotice] = useState("")
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)

  useEffect(() => {
    if (!allowed) return
    const isCurrent = gate.start()
    setLoadState("loading")
    setSessions([]); setMembers([]); setSessionId(null); setSelected([]); setResults([]); setSummary(""); setNotice("")
    Promise.all([api.get<Session[]>("/attendance/sessions"), api.get<Member[]>("/members")]).then(
      ([sessionData, memberData]) => {
        if (!isCurrent()) return
        setSessions(Array.isArray(sessionData) ? sessionData.filter((session) => session.status === "open") : [])
        setMembers(Array.isArray(memberData) ? memberData : [])
        setLoadState("ready")
      },
      () => { if (isCurrent()) setLoadState("error") },
    )
    return () => gate.invalidate()
  }, [allowed, contextKey, attempt, gate])

  if (!allowed) {
    return (
      <View style={styles.center}>
        <Text style={styles.heading}>{t("wiring.checkin.deniedTitle")}</Text>
        <Text style={styles.text}>{t("wiring.checkin.denied")}</Text>
      </View>
    )
  }
  if (loadState === "loading") return <LoadingState />
  if (loadState === "error") return <ErrorState message={t("wiring.checkin.loadError")} onRetry={() => setAttempt((value) => value + 1)} />
  if (sessions.length === 0 && members.length === 0) return <EmptyState message={t("wiring.checkin.noOpenSessions")} />

  const nameOf = (id: string) => {
    const member = members.find((item) => item.id === id)
    return member ? `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim() || id : id
  }
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])

  // Every submit path: one request at a time, a visible reason when input is missing, and results only for the context that started it.
  async function singleCheckIn(kind: "manual" | "qr") {
    if (!sessionId && kind === "manual") return setNotice(t("wiring.checkin.needSession"))
    const mid = memberId.trim()
    if (!mid) return setNotice(t("wiring.checkin.needMember"))
    if (kind === "qr" && !token.trim()) return setNotice(t("wiring.checkin.needToken"))
    if (busyRef.current) return
    busyRef.current = true; setBusy(true); setNotice(""); setSummary("")
    const started = contextRef.current
    const outcome = kind === "manual" && sessionId
      ? await submitManualCheckin(sessionId, mid)
      : await submitQrCheckin(token.trim(), mid)
    busyRef.current = false; setBusy(false)
    if (contextRef.current !== started) return
    setResults([{ key: `${kind}-${mid}`, label: nameOf(mid), outcome }])
    if (outcome === "success") setMemberId("")
  }

  async function batchCheckIn() {
    if (!sessionId) return setNotice(t("wiring.checkin.needSession"))
    if (selected.length === 0) return setNotice(t("wiring.checkin.needSelection"))
    if (busyRef.current) return
    busyRef.current = true; setBusy(true); setNotice(""); setSummary("")
    const started = contextRef.current
    const collected: Result[] = []
    for (const id of selected) {
      // Stop if the church or role changed; the rest must not be submitted under the new context.
      if (contextRef.current !== started) break
      const outcome = await submitManualCheckin(sessionId, id)
      collected.push({ key: id, label: nameOf(id), outcome })
    }
    busyRef.current = false; setBusy(false)
    if (contextRef.current !== started) return
    const ok = collected.filter((item) => item.outcome === "success").length
    setResults(collected)
    setSummary(t("wiring.checkin.summary", { ok, failed: collected.length - ok }))
    setSelected([])
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t("wiring.checkin.title")}</Text>
      <Text style={styles.heading}>{t("wiring.checkin.sessionHeading")}</Text>
      {sessions.length === 0 ? <Text style={styles.text}>{t("wiring.checkin.noOpenSessions")}</Text> : sessions.map((session) => {
        const active = session.id === sessionId
        return (
          <Pressable
            key={session.id}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            onPress={() => { setSessionId(session.id); setResults([]); setSummary("") }}
            style={[styles.card, { minHeight: 44, paddingVertical: 10 }]}
          >
            <Text style={styles.heading}>{session.title || session.sessionDate}</Text>
            <Text style={styles.text}>{active ? t("wiring.checkin.sessionSelected") : t("wiring.checkin.sessionTap")}</Text>
          </Pressable>
        )
      })}

      <Text style={styles.heading}>{t("wiring.checkin.manualHeading")}</Text>
      <TextInput accessibilityLabel={t("wiring.checkin.memberIdLabel")} autoCapitalize="none" onChangeText={setMemberId} style={styles.input} value={memberId} />
      <Button title={t("wiring.checkin.checkIn")} disabled={busy} onPress={() => void singleCheckIn("manual")} />

      <Text style={styles.heading}>{t("wiring.checkin.qrHeading")}</Text>
      <TextInput accessibilityLabel={t("wiring.checkin.qrLabel")} autoCapitalize="none" onChangeText={setToken} style={styles.input} value={token} />
      <Button title={t("wiring.checkin.qrCheckIn")} disabled={busy} onPress={() => void singleCheckIn("qr")} />

      <Text style={styles.heading}>{t("wiring.checkin.batchHeading")}</Text>
      {members.length === 0 ? <Text style={styles.text}>{t("wiring.checkin.noMembers")}</Text> : members.map((member) => {
        const checked = selected.includes(member.id)
        return (
          <Pressable
            key={member.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
            onPress={() => toggle(member.id)}
            style={[styles.card, { minHeight: 44, paddingVertical: 10 }]}
          >
            <Text style={styles.text}>{`${checked ? t("wiring.checkin.checked") : t("wiring.checkin.unchecked")} · ${nameOf(member.id)}`}</Text>
          </Pressable>
        )
      })}
      <Button title={t("wiring.checkin.batchSubmit", { count: selected.length })} disabled={busy || selected.length === 0} onPress={() => void batchCheckIn()} />

      {notice ? <Text accessibilityLiveRegion="polite" style={styles.error}>{notice}</Text> : null}
      {busy ? <Text style={styles.text}>{t("wiring.checkin.submitting")}</Text> : null}
      {summary ? <Text accessibilityLiveRegion="polite" style={styles.success}>{summary}</Text> : null}
      {results.map((result) => (
        <Text key={result.key} accessibilityLiveRegion="polite" style={styles.text}>
          {`${result.label}: ${t(OUTCOME_KEY[result.outcome])}`}
        </Text>
      ))}
    </ScrollView>
  )
}
