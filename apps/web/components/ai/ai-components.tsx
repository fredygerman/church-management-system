"use client"

import { useId, useState, type FormEvent } from "react"
import Link from "next/link"
import {
  AI_ACTION_REGISTRY,
  type AiCellValue,
  type AiComponent,
  type AiFormField,
} from "@church/config"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useT } from "@/components/i18n/locale-provider"
import type { Translate } from "@church/config"

// Only registered actions may run. The registry ships empty (DEC-08).
function isActionAvailable(actionId: string): boolean {
  return Object.prototype.hasOwnProperty.call(AI_ACTION_REGISTRY, actionId)
}

// The API validator already enforces this; the check here is defence in depth.
function isRelativeHref(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//") && !href.includes("\\")
}

function formatCell(value: AiCellValue | undefined, t: Translate): string {
  if (value === null || value === undefined) return "-"
  if (typeof value === "boolean") return value ? t("final.ai.yes") : t("final.ai.no")
  return String(value)
}

function TextBlock({ text }: { text: string }) {
  return <p className="text-sm">{text}</p>
}

function StatCardsBlock({ items }: { items: { label: string; value: string; hint?: string }[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => (
        <Card key={i}>
          <CardContent className="space-y-1 p-4">
            <p className="text-muted-foreground text-xs">{item.label}</p>
            <p className="text-2xl font-semibold">{item.value}</p>
            {item.hint && <p className="text-muted-foreground text-xs">{item.hint}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function TableBlock({
  columns,
  rows,
}: {
  columns: { key: string; label: string }[]
  rows: Record<string, AiCellValue>[]
}) {
  const { t } = useT()
  return (
    <Table aria-label={t("final.ai.resultsLabel")}>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.key} scope="col">
              {col.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={columns.length} className="text-muted-foreground">
              {t("final.ai.noRows")}
            </TableCell>
          </TableRow>
        )}
        {rows.map((row, i) => (
          <TableRow key={i}>
            {columns.map((col) => (
              <TableCell key={col.key}>{formatCell(row[col.key], t)}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function ListBlock({
  items,
}: {
  items: { title: string; subtitle?: string; href?: string }[]
}) {
  return (
    <ul className="divide-y rounded-md border">
      {items.map((item, i) => (
        <li key={i} className="px-4 py-3">
          {item.href && isRelativeHref(item.href) ? (
            <Link href={item.href} className="text-primary text-sm font-medium underline-offset-4 hover:underline">
              {item.title}
            </Link>
          ) : (
            <p className="text-sm font-medium">{item.title}</p>
          )}
          {item.subtitle && <p className="text-muted-foreground text-xs">{item.subtitle}</p>}
        </li>
      ))}
    </ul>
  )
}

function FormFieldInput({
  id,
  field,
  value,
  disabled,
  onChange,
}: {
  id: string
  field: AiFormField
  value: string
  disabled: boolean
  onChange: (value: string) => void
}) {
  const { t } = useT()
  const common = {
    id,
    name: field.name,
    required: field.required,
    disabled,
    value,
    onChange: (e: { target: { value: string } }) => onChange(e.target.value),
  }

  let control
  if (field.kind === "textarea") {
    control = <Textarea {...common} />
  } else if (field.kind === "select") {
    control = (
      <select
        {...common}
        className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm disabled:opacity-50"
      >
        <option value="">{t("final.ai.select")}</option>
        {(field.options ?? []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )
  } else {
    control = <Input {...common} type={field.kind === "number" ? "number" : field.kind === "date" ? "date" : "text"} />
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{field.label}</Label>
      {control}
    </div>
  )
}

function FormBlock({
  fields,
  submit,
}: {
  fields: AiFormField[]
  submit: { label: string; actionId: string }
}) {
  const { t } = useT()
  const baseId = useId()
  const [values, setValues] = useState<Record<string, string>>({})
  const available = isActionAvailable(submit.actionId)
  const noticeId = `${baseId}-notice`

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // The assistant never calls the API itself. Running a registered action
    // (after confirmation, with the user's token) is not built yet.
    // TODO: execute the registered action once one is approved.
    event.preventDefault()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-md border p-4" aria-describedby={available ? undefined : noticeId}>
      {fields.map((field) => (
        <FormFieldInput
          key={field.name}
          id={`${baseId}-${field.name}`}
          field={field}
          value={values[field.name] ?? ""}
          disabled={!available}
          onChange={(value) => setValues((prev) => ({ ...prev, [field.name]: value }))}
        />
      ))}
      {!available && (
        <p id={noticeId} role="status" className="text-muted-foreground text-xs">
          {t("final.ai.notAvailable")}
        </p>
      )}
      <Button type="submit" disabled={!available}>
        {submit.label}
      </Button>
    </form>
  )
}

function ConfirmActionBlock({
  title,
  summary,
  actionId,
}: {
  title: string
  summary: string
  actionId: string
}) {
  const { t } = useT()
  const baseId = useId()
  const available = isActionAvailable(actionId)
  const noticeId = `${baseId}-notice`

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-muted-foreground text-sm">{summary}</p>
        {!available && (
          <p id={noticeId} role="status" className="text-muted-foreground text-xs">
            {t("final.ai.notAvailable")}
          </p>
        )}
        {/* TODO: run the registered action after the user confirms, with their own token. */}
        <Button type="button" disabled={!available} aria-describedby={available ? undefined : noticeId}>
          {title}
        </Button>
      </CardContent>
    </Card>
  )
}

function LinkButtonBlock({ label, href }: { label: string; href: string }) {
  if (!isRelativeHref(href)) return null
  return (
    <Button asChild variant="outline">
      <Link href={href}>{label}</Link>
    </Button>
  )
}

function NoticeBlock({ tone, text }: { tone: "info" | "warning"; text: string }) {
  return (
    <Alert variant={tone === "warning" ? "destructive" : "default"}>
      <AlertDescription>{text}</AlertDescription>
    </Alert>
  )
}

function AiComponentView({ component }: { component: AiComponent }) {
  switch (component.type) {
    case "text":
      return <TextBlock text={component.text} />
    case "stat_cards":
      return <StatCardsBlock items={component.items} />
    case "table":
      return <TableBlock columns={component.columns} rows={component.rows} />
    case "list":
      return <ListBlock items={component.items} />
    case "form":
      return <FormBlock fields={component.fields} submit={component.submit} />
    case "confirm_action":
      return (
        <ConfirmActionBlock
          title={component.title}
          summary={component.summary}
          actionId={component.action.actionId}
        />
      )
    case "link_button":
      return <LinkButtonBlock label={component.label} href={component.href} />
    case "notice":
      return <NoticeBlock tone={component.tone} text={component.text} />
    default:
      return null
  }
}

/** Renders a validated AI response as native components. Never uses raw HTML. */
export function AiComponents({ components }: { components: AiComponent[] }) {
  return (
    <div className="space-y-4">
      {components.map((component, i) => (
        <AiComponentView key={i} component={component} />
      ))}
    </div>
  )
}
