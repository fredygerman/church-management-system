import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { SupportForm } from "@/components/support/support-form"
import { getTranslator } from "@/lib/i18n/server"

const FAQS = [
  {
    questionKey: "final.support.faq1.q",
    answerKey: "final.support.faq1.a",
  },
  {
    questionKey: "final.support.faq2.q",
    answerKey: "final.support.faq2.a",
  },
  {
    questionKey: "final.support.faq3.q",
    answerKey: "final.support.faq3.a",
  },
] as const

export default async function SupportPage() {
  const t = await getTranslator()
  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      {/* Hero Section */}
      <section className="mb-20 text-center">
        <h1 className="mb-6 text-5xl font-bold">{t("final.support.heroTitle")}</h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600">
          {t("final.support.heroSubtitle")}
        </p>
      </section>

      {/* FAQ Section */}
      <section className="mb-20">
        <h2 className="mb-8 text-center text-3xl font-semibold">
          {t("final.support.faqTitle")}
        </h2>
        <Accordion
          type="single"
          collapsible
          className="mx-auto w-full max-w-3xl"
        >
          {FAQS.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {t(faq.questionKey)}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                {t(faq.answerKey)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Contact Channels */}
      <section className="mb-20">
        <h2 className="mb-8 text-center text-3xl font-semibold">
          {t("final.support.channels")}
        </h2>
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Contact channel cards remain the same */}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="mb-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-8 text-center text-3xl font-semibold">
            {t("nav.contactUs")}
          </h2>
          <SupportForm />
        </div>
      </section>

      {/* Support Hours */}
      <section className="mx-auto max-w-2xl rounded-lg bg-gray-50 p-6 text-center">
        <h3 className="mb-4 text-xl font-semibold">{t("final.support.hours")}</h3>
        <p className="mb-2 text-gray-600">{t("final.support.hoursRange")}</p>
        <p className="text-gray-600">
          {t("final.support.responseTime")}
        </p>
      </section>
    </div>
  )
}
