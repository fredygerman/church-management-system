import { AiChatPanel } from "@/components/ai/ai-chat-panel"
import { getTranslator } from "@/lib/i18n/server"

interface PageProps {
  params: Promise<{ churchId: string }>
}

export default async function AssistantPage({ params }: PageProps) {
  const { churchId } = await params
  const t = await getTranslator()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-foreground text-2xl font-semibold">{t("staff.ai.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("staff.ai.description")}</p>
      </div>

      <AiChatPanel churchId={churchId} />
    </div>
  )
}
