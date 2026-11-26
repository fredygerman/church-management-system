import { router, type Href } from "expo-router"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { Button, Card, TextField } from "../ui"
import { colors, radii, spacing, type } from "../../theme"
import type { AiComponent, AiFormField, AiTableComponent } from "@church/config/ai"
import { useT } from "../../lib/locale"

// Native renderer for the AI contract. Plain text only: no HTML, markdown or links
// beyond the in-app routes listed here. Input must already pass validateAiResponse.

// Routes that exist in apps/mobile/app. Relative hrefs outside this list are not tappable.
const APP_ROUTES = new Set(["/", "/church", "/events", "/library", "/profile", "/prayer", "/people", "/services", "/content", "/more", "/ai"])

function appRoute(href: string | undefined): Href | null {
  if (!href) return null
  if (APP_ROUTES.has(href) || /^\/events\/[^/]+$/.test(href)) return href as Href
  return null
}

export function AiResponseView({ components }: { components: AiComponent[] }) {
  return <View style={styles.stack}>{components.map((component, index) => <AiComponentView key={index} component={component} />)}</View>
}

function AiComponentView({ component }: { component: AiComponent }) {
  const { t } = useT()
  switch (component.type) {
    case "text":
      return <Text style={styles.text}>{component.text}</Text>
    case "stat_cards":
      return (
        <View style={styles.cardRow}>
          {component.items.map((item, index) => (
            <Card key={index} style={styles.statCard}>
              <Text style={styles.statLabel}>{item.label}</Text>
              <Text style={styles.statValue}>{item.value}</Text>
              {item.hint ? <Text style={styles.statHint}>{item.hint}</Text> : null}
            </Card>
          ))}
        </View>
      )
    case "table":
      return <AiTable table={component} />
    case "list":
      return (
        <View style={styles.stack}>
          {component.items.map((item, index) => {
            const route = appRoute(item.href)
            const body = (
              <>
                <Text style={styles.itemTitle}>{item.title}</Text>
                {item.subtitle ? <Text style={styles.statHint}>{item.subtitle}</Text> : null}
              </>
            )
            return route ? (
              <Pressable accessibilityRole="button" key={index} onPress={() => router.push(route)} style={styles.listRow}>{body}</Pressable>
            ) : (
              <View key={index} style={styles.listRow}>{body}</View>
            )
          })}
        </View>
      )
    case "form":
      return (
        <View style={styles.box}>
          {component.fields.map((field) => <DisabledField key={field.name} field={field} />)}
          <Button disabled title={component.submit.label} onPress={() => undefined} />
          <Text style={styles.notice}>{t("final.ai.notAvailable")}</Text>
        </View>
      )
    case "confirm_action":
      return (
        <View style={styles.box}>
          <Text style={styles.itemTitle}>{component.title}</Text>
          <Text style={styles.text}>{component.summary}</Text>
          <Button disabled title={t("common.confirm")} onPress={() => undefined} />
          <Text style={styles.notice}>{t("final.ai.notAvailable")}</Text>
        </View>
      )
    case "link_button": {
      const route = appRoute(component.href)
      return route ? (
        <Button title={component.label} onPress={() => router.push(route)} />
      ) : (
        <Text style={styles.text}>{component.label}</Text>
      )
    }
    case "notice":
      return (
        <View style={component.tone === "warning" ? styles.warning : styles.info}>
          <Text style={styles.noticeText}>{component.text}</Text>
        </View>
      )
  }
}

function AiTable({ table }: { table: AiTableComponent }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <View>
        <View style={[styles.tableRow, styles.tableHeader]}>
          {table.columns.map((column) => <Text key={column.key} style={[styles.cell, styles.cellHeader]}>{column.label}</Text>)}
        </View>
        {table.rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.tableRow}>
            {table.columns.map((column) => {
              const value = row[column.key]
              return <Text key={column.key} style={styles.cell}>{value === null || value === undefined ? "—" : String(value)}</Text>
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

function DisabledField({ field }: { field: AiFormField }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{field.label}{field.required ? " *" : ""}</Text>
      {field.kind === "select" ? (
        <View style={styles.chipRow}>
          {(field.options ?? []).map((option) => <Text key={option.value} style={styles.chip}>{option.label}</Text>)}
        </View>
      ) : (
        <TextField
          accessibilityLabel={field.label}
          editable={false}
          multiline={field.kind === "textarea"}
          placeholder={field.kind === "date" ? "YYYY-MM-DD" : undefined}
          style={[styles.input, field.kind === "textarea" && styles.textarea]}
          value=""
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  box: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.card, borderWidth: 1, gap: spacing.md, padding: spacing.md },
  text: { ...type.body, color: colors.ink },
  cardRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { flexBasis: "45%", flexGrow: 1, gap: spacing.xs, padding: spacing.md },
  statLabel: { ...type.caption, color: colors.muted },
  statValue: { ...type.h2, color: colors.ink },
  statHint: { ...type.caption, color: colors.muted },
  itemTitle: { ...type.body, color: colors.ink, fontWeight: "600" },
  listRow: { borderBottomColor: colors.border, borderBottomWidth: 1, gap: spacing.xs, minHeight: 44, justifyContent: "center", paddingVertical: spacing.sm },
  tableHeader: { backgroundColor: colors.tint },
  tableRow: { flexDirection: "row", borderBottomColor: colors.border, borderBottomWidth: 1 },
  cell: { ...type.supporting, color: colors.ink, padding: spacing.sm, width: 140 },
  cellHeader: { fontWeight: "700", color: colors.brandStrong },
  field: { gap: 6 },
  fieldLabel: { ...type.supporting, color: colors.ink, fontWeight: "600" },
  input: { borderColor: colors.border, borderRadius: radii.card, borderWidth: 1, color: colors.muted, padding: spacing.md },
  textarea: { minHeight: 80, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { borderColor: colors.border, borderRadius: radii.pill, borderWidth: 1, color: colors.muted, overflow: "hidden", paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  notice: { ...type.caption, color: colors.muted },
  info: { backgroundColor: colors.tint, borderRadius: radii.card, padding: spacing.md },
  warning: { backgroundColor: "#FEF3C7", borderRadius: radii.card, padding: spacing.md },
  noticeText: { ...type.supporting, color: colors.ink },
})
