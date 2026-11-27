import { Fragment, type ReactNode } from "react"

import type { ViewBlock, ViewInline } from "@/lib/announcements/doc-view-model"
import { AnnouncementImage } from "./announcement-image"

// Renders the announcement body from the view model. React elements only: no raw HTML.
// Files are skipped here because the page lists them in their own section.
export function DocView({ blocks, churchId }: { blocks: ViewBlock[]; churchId: string }) {
  return <div className="text-foreground space-y-4 text-sm leading-relaxed">{renderBlocks(blocks, churchId)}</div>
}

function renderInlines(inlines: ViewInline[]): ReactNode[] {
  return inlines.map((inline, index) => {
    if (inline.kind === "break") return <br key={index} />

    let node: ReactNode = inline.text
    if (inline.bold) node = <strong>{node}</strong>
    if (inline.italic) node = <em>{node}</em>
    if (inline.href) {
      node = (
        <a href={inline.href} target="_blank" rel="noopener noreferrer" className="text-primary underline">
          {node}
        </a>
      )
    }
    return <Fragment key={index}>{node}</Fragment>
  })
}

function renderBlocks(blocks: ViewBlock[], churchId: string): ReactNode[] {
  return blocks.map((block, index) => renderBlock(block, index, churchId)).filter((node) => node !== null)
}

function renderBlock(block: ViewBlock, key: number, churchId: string): ReactNode | null {
  switch (block.kind) {
    case "paragraph":
      return <p key={key}>{renderInlines(block.children)}</p>
    case "heading":
      // The page title is the h1, so body headings start at h2.
      return block.level === 1 ? (
        <h2 key={key} className="text-foreground pt-2 text-lg font-semibold">
          {renderInlines(block.children)}
        </h2>
      ) : (
        <h3 key={key} className="text-foreground pt-2 text-base font-semibold">
          {renderInlines(block.children)}
        </h3>
      )
    case "bulletList":
      return (
        <ul key={key} className="list-disc space-y-1 pl-6">
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderBlocks(item, churchId)}</li>
          ))}
        </ul>
      )
    case "orderedList":
      return (
        <ol key={key} className="list-decimal space-y-1 pl-6">
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderBlocks(item, churchId)}</li>
          ))}
        </ol>
      )
    case "blockquote":
      return (
        <blockquote key={key} className="border-border text-muted-foreground border-l-2 pl-4 italic">
          {renderBlocks(block.children, churchId)}
        </blockquote>
      )
    case "image":
      return (
        <AnnouncementImage
          key={`${block.attachmentId}-${key}`}
          churchId={churchId}
          attachmentId={block.attachmentId}
          alt={block.alt}
        />
      )
    case "file":
      return null
    default:
      return null
  }
}
