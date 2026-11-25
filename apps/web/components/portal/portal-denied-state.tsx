import { getTranslator } from "@/lib/i18n/server"

// apiRequest redirects to /forbidden on 403. Next.js encodes that redirect as an
// error whose digest carries the target path, and page try/catch blocks swallow it.
// Pages use this to show a denied message instead of a generic "could not load".
export function isForbiddenError(error: unknown): boolean {
  const digest = (error as { digest?: unknown } | null)?.digest
  return (
    typeof digest === "string" &&
    digest.startsWith("NEXT_REDIRECT;") &&
    digest.includes(";/forbidden;")
  )
}

export async function PortalDeniedState({ title }: { title: string }) {
  const t = await getTranslator()
  return (
    <div className="space-y-4">
      <h1 className="text-foreground text-2xl font-semibold">{title}</h1>
      <div className="border-border bg-card rounded-lg border p-5">
        <p className="text-muted-foreground text-sm">
          {t("portal.denied.body")}
        </p>
      </div>
    </div>
  )
}
