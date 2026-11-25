import { BookOpen, Wrench, FileText, Code2, Activity, ScrollText, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getTranslator } from "@/lib/i18n/server"

const DOCS_CATEGORIES = [
  {
    titleKey: "final.docs.gettingStarted.title",
    descriptionKey: "final.docs.gettingStarted.desc",
    icon: BookOpen,
    linkKeys: ["final.docs.gettingStarted.quickStart", "final.docs.gettingStarted.installation", "final.docs.gettingStarted.concepts"] as const,
  },
  {
    titleKey: "final.docs.api.title",
    descriptionKey: "final.docs.api.desc",
    icon: Wrench,
    linkKeys: ["final.docs.api.endpoints", "final.docs.api.authentication", "final.docs.api.rateLimits"] as const,
  },
  {
    titleKey: "final.docs.tutorials.title",
    descriptionKey: "final.docs.tutorials.desc",
    icon: FileText,
    linkKeys: ["final.docs.tutorials.basic", "final.docs.tutorials.advanced", "final.docs.tutorials.practices"] as const,
  },
] as const

const QUICK_LINKS = [
  { titleKey: "final.docs.quick.developerPortal", url: "/dev", icon: Code2 },
  { titleKey: "final.docs.quick.apiStatus", url: "/status", icon: Activity },
  { titleKey: "final.docs.quick.releaseNotes", url: "/releases", icon: ScrollText },
  { titleKey: "final.docs.quick.community", url: "/forum", icon: Users },
] as const

export default async function DocsPage() {
  const t = await getTranslator()
  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      {/* Hero Section */}
      <section className="mb-16 text-center">
        <h1 className="mb-6 text-5xl font-bold">{t("nav.documentation")}</h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          {t("final.docs.subtitle")}
        </p>
      </section>

      {/* Quick Links */}
      <section className="mb-16">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {QUICK_LINKS.map((link, index) => (
            <Card key={index} className="p-4 text-center hover:bg-muted">
              <link.icon className="mx-auto mb-2 h-6 w-6 text-primary" />
              <h3 className="font-medium">{t(link.titleKey)}</h3>
            </Card>
          ))}
        </div>
      </section>

      {/* Documentation Categories */}
      <section className="mb-16">
        <h2 className="mb-8 text-center text-3xl font-semibold">
          {t("nav.documentation")}
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          {DOCS_CATEGORIES.map((category, index) => (
            <Card key={index} className="p-6">
              <category.icon className="mb-4 h-8 w-8 text-primary" />
              <h3 className="mb-2 text-xl font-semibold">{t(category.titleKey)}</h3>
              <p className="mb-4 text-muted-foreground">{t(category.descriptionKey)}</p>
              <ul className="space-y-2">
                {category.linkKeys.map((linkKey, linkIndex) => (
                  <li key={linkIndex}>
                    <Button variant="link" className="p-0">
                      {t(linkKey)}
                    </Button>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* Resources Section */}
      <section className="rounded-lg bg-muted p-8">
        <h2 className="mb-6 text-center text-2xl font-semibold">
          {t("final.docs.additional")}
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-4 text-xl font-medium">{t("final.docs.devTools")}</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>{t("final.docs.sdk")}</li>
              <li>{t("final.docs.apiExplorer")}</li>
              <li>{t("final.docs.codeSamples")}</li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-xl font-medium">{t("nav.section.support")}</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>{t("final.docs.developerSupport")}</li>
              <li>Stack Overflow</li>
              <li>GitHub Discussions</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
