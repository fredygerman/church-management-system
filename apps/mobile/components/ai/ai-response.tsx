import { router, type Href } from "expo-router"
import { Button, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"
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
            <View key={index} style={styles.statCard}>
              <Text style={styles.statLabel}>{item.label}</Text>
              <Text style={styles.statValue}>{item.value}</Text>
              {item.hint ? <Text style={styles.statHint}>{item.hint}</Text> : null}
            </View>
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
        <TextInput
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
  box: { borderColor: "#d1d5db", borderRadius: 8, borderWidth: 1, gap: 10, padding: 12 },
  text: { color: "#1f2937", fontSize: 16, lineHeight: 22 },
  cardRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { borderColor: "#d1d5db", borderRadius: 8, borderWidth: 1, flexBasis: "45%", flexGrow: 1, gap: 4, padding: 12 },
  statLabel: { color: "#4b5563", fontSize: 13 },
  statValue: { fontSize: 22, fontWeight: "700" },
  statHint: { color: "#6b7280", fontSize: 13 },
  itemTitle: { fontSize: 16, fontWeight: "600" },
  listRow: { borderBottomColor: "#e5e7eb", borderBottomWidth: 1, gap: 2, paddingVertical: 8 },
  tableHeader: { backgroundColor: "#f3f4f6" },
  tableRow: { flexDirection: "row", borderBottomColor: "#e5e7eb", borderBottomWidth: 1 },
  cell: { padding: 8, width: 140, fontSize: 14 },
  cellHeader: { fontWeight: "700" },
  field: { gap: 6 },
  fieldLabel: { fontSize: 14, fontWeight: "600" },
  input: { borderColor: "#d1d5db", borderRadius: 6, borderWidth: 1, color: "#6b7280", padding: 10 },
  textarea: { minHeight: 80, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { borderColor: "#d1d5db", borderRadius: 16, borderWidth: 1, color: "#6b7280", overflow: "hidden", paddingHorizontal: 10, paddingVertical: 4 },
  notice: { color: "#6b7280", fontSize: 13 },
  info: { backgroundColor: "#eff6ff", borderRadius: 8, padding: 12 },
  warning: { backgroundColor: "#fef3c7", borderRadius: 8, padding: 12 },
  noticeText: { color: "#1f2937", fontSize: 14 },
})
