import { useMemo } from "react"
import { Linking, StyleSheet, Text, View, type TextStyle } from "react-native"
import { colors, spacing, type } from "../../theme"
import { ImageBlock, FileRow } from "./attachment-blocks"
import type { AttachmentUrlCache } from "./attachment-urls"
import { toDocBlocks, withoutFiles, type InlineRun, type RichBlock } from "./model"

type RichTextProps = {
  /** The doc_v1 body as the API returns it. Anything else renders nothing. */
  doc: unknown
  cache: AttachmentUrlCache
  /** Set when the file rows are listed elsewhere on the screen, so they are not shown twice. */
  skipFiles?: boolean
}

/** Native renderer for doc_v1 announcement bodies. Plain React Native views only (DEC-15: no WebView). */
export function RichTextBody({ doc, cache, skipFiles = false }: RichTextProps) {
  const blocks = useMemo(() => {
    const all = toDocBlocks(doc)
    return skipFiles ? withoutFiles(all) : all
  }, [doc, skipFiles])

  return <View style={styles.body}>
    {blocks.map((block, index) => <BlockView key={index} block={block} cache={cache} />)}
  </View>
}

function BlockView({ block, cache }: { block: RichBlock; cache: AttachmentUrlCache }) {
  // Each branch is wrapped in braces: the scanner in i18n/hardcoded.test.ts reads `/> ... <` text as English.
  switch (block.kind) {
    case "paragraph": { return <InlineText runs={block.runs} style={styles.paragraph} /> }
    case "heading": { return <InlineText runs={block.runs} style={block.level === 1 ? styles.heading1 : styles.heading2} /> }
    case "list": {
      return <View style={styles.list}>
        {block.items.map((item, index) => <View key={index} style={styles.listItem}>
          <Text style={styles.marker}>{block.ordered ? `${index + 1}.` : "•"}</Text>
          <View style={styles.listContent}>
            {item.map((child, childIndex) => <BlockView key={childIndex} block={child} cache={cache} />)}
          </View>
        </View>)}
      </View>
    }
    case "quote": {
      return <View style={styles.quote}>
        {block.blocks.map((child, index) => <BlockView key={index} block={child} cache={cache} />)}
      </View>
    }
    case "image": { return <ImageBlock attachmentId={block.attachmentId} alt={block.alt} cache={cache} /> }
    case "file": { return <FileRow file={block} cache={cache} /> }
  }
}

function InlineText({ runs, style }: { runs: InlineRun[]; style: TextStyle }) {
  return <Text style={style}>
    {runs.map((run, index) => {
      const href = run.href
      return <Text
        key={index}
        accessibilityRole={href ? "link" : undefined}
        onPress={href ? () => { void Linking.openURL(href).catch(() => undefined) } : undefined}
        style={[run.bold ? styles.bold : null, run.italic ? styles.italic : null, href ? styles.link : null]}
      >
        {run.text}
      </Text>
    })}
  </Text>
}

const styles = StyleSheet.create({
  body: { gap: spacing.md },
  paragraph: { ...type.body, color: colors.ink },
  heading1: { ...type.h2, color: colors.ink },
  heading2: { ...type.h3, color: colors.ink },
  bold: { fontWeight: "700" },
  italic: { fontStyle: "italic" },
  link: { color: colors.brand, textDecorationLine: "underline" },
  list: { gap: spacing.sm },
  listItem: { flexDirection: "row", gap: spacing.sm },
  marker: { ...type.body, color: colors.ink, minWidth: 20 },
  listContent: { flex: 1, gap: spacing.sm },
  quote: { gap: spacing.sm, paddingLeft: spacing.md, borderLeftWidth: 3, borderLeftColor: colors.brand, backgroundColor: colors.tint, paddingVertical: spacing.sm, paddingRight: spacing.sm },
})
