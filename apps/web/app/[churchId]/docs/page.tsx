import { getTranslator } from "@/lib/i18n/server"

export default async function DocsPage() {
  const t = await getTranslator()
  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      <section className="text-center">
        <h1 className="text-5xl font-bold">{t("nav.documentation")}</h1>
      </section>
    </div>
  )
}
