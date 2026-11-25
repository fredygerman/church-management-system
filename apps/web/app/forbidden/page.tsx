import Link from "next/link"
import { getTranslator } from "@/lib/i18n/server"

export default async function ForbiddenPage() {
  const t = await getTranslator()
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-4xl font-bold">403</h1>
      <h2 className="text-2xl font-semibold">{t("final.forbidden.title")}</h2>
      <p className="max-w-lg text-muted-foreground">
        {t("final.forbidden.body")}
      </p>
      <Link
        href="/"
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
      >
        {t("final.forbidden.goHome")}
      </Link>
    </div>
  )
}
