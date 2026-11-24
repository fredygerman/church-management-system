"use client"

import { useId, useState, type FormEvent } from "react"
import type { AiComponent } from "@church/config"

import { sendAiMessage } from "@/actions/ai"
import { AiComponents } from "@/components/ai/ai-components"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UnavailableState } from "@/components/ui/unavailable-state"

type Turn =
  | { role: "user"; text: string }
  | { role: "assistant"; components: AiComponent[] }

type Status = "idle" | "loading" | "error" | "unavailable"

interface AiChatPanelProps {
  churchId: string
}

export function AiChatPanel({ churchId }: AiChatPanelProps) {
  const inputId = useId()
  // Kept in component state only (not persisted), per the AI contract.
  const [conversationId, setConversationId] = useState<string | undefined>(undefined)
  const [turns, setTurns] = useState<Turn[]>([])
  const [input, setInput] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [message, setMessage] = useState("")

  async function send(text: string) {
    setStatus("loading")
    setMessage("")
    const result = await sendAiMessage(churchId, text, conversationId)

    if (result.status === "ok") {
      setConversationId(result.conversationId)
      setTurns((prev) => [
        ...prev,
        { role: "user", text },
        { role: "assistant", components: result.components },
      ])
      setInput("")
      setStatus("idle")
      return
    }

    // The typed text stays in the input so a failed send can be retried.
    setMessage(result.message)
    setStatus(result.status)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = input.trim()
    if (!text || status === "loading" || status === "unavailable") return
    void send(text)
  }

  function startNewConversation() {
    setConversationId(undefined)
    setTurns([])
    setInput("")
    setMessage("")
    setStatus("idle")
  }

  const unavailable = status === "unavailable"
  const busy = status === "loading"

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={startNewConversation} disabled={busy}>
          New conversation
        </Button>
      </div>

      <section aria-label="Conversation" aria-live="polite" className="space-y-4">
        {turns.map((turn, i) =>
          turn.role === "user" ? (
            <div key={i} className="bg-primary text-primary-foreground ml-auto max-w-[85%] rounded-lg px-3 py-2 text-sm">
              {turn.text}
            </div>
          ) : (
            <AiComponents key={i} components={turn.components} />
          ),
        )}

        {busy && (
          <p role="status" className="text-muted-foreground animate-pulse text-sm">
            Assistant is thinking...
          </p>
        )}

        {status === "error" && (
          <div role="alert" className="border-destructive/50 bg-card space-y-3 rounded-lg border p-4">
            <p className="text-destructive text-sm">{message}</p>
            <Button type="button" variant="outline" size="sm" onClick={() => void send(input.trim())} disabled={!input.trim()}>
              Try again
            </Button>
          </div>
        )}

        {unavailable && <UnavailableState title="Assistant" message="AI is not available right now." />}
      </section>

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor={inputId} className="sr-only">
            Ask the assistant
          </Label>
          <Input
            id={inputId}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question"
            disabled={busy || unavailable}
            autoComplete="off"
          />
        </div>
        <Button type="submit" disabled={busy || unavailable || !input.trim()}>
          Send
        </Button>
      </form>
    </div>
  )
}
