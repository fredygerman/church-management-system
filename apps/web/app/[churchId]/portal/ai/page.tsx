import { AiChatPanel } from "@/components/ai/ai-chat-panel"

interface PageProps {
  params: Promise<{ churchId: string }>
}

export default async function AssistantPage({ params }: PageProps) {
  const { churchId } = await params

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-foreground text-2xl font-semibold">Assistant</h1>
        <p className="text-muted-foreground text-sm">Ask questions about your church. Answers come from data you can already see.</p>
      </div>

      <AiChatPanel churchId={churchId} />

      {/* TODO: Add reviewed Swahili copy for this assistant page. */}
    </div>
  )
}
