/**
 * AI response contract (DEC-08).
 *
 * The API validates every AI answer with `validateAiResponse` before sending it;
 * web and mobile render only these component types, natively. No HTML, markdown,
 * scripts or free-form props exist in this contract.
 *
 * Rules (see docs/shipwave/platform/specs/ai-components.md):
 * - Read-only. Components never mutate data by themselves.
 * - Any write is a `confirm_action` (or form submit) that references an actionId
 *   in the client's action registry, and runs only after the user taps confirm,
 *   with the user's own token.
 * - Hrefs are relative in-app paths only.
 */

import type { PermissionAction } from '../permissions'

// ============================================================================
// LIMITS
// ============================================================================

export const AI_LIMITS = {
  /** Max components in one response. */
  maxComponents: 20,
  /** `text` component. */
  textMaxChars: 280,
  /** Labels, titles, values and option labels. */
  labelMaxChars: 120,
  /** Free-form summaries and list subtitles, hints, cell strings. */
  summaryMaxChars: 280,
  /** Relative in-app href. */
  hrefMaxChars: 2048,
  statCards: { maxItems: 12 },
  table: { maxColumns: 10, maxRows: 50 },
  list: { maxItems: 50 },
  form: { maxFields: 20, maxOptions: 100 },
  /** Param count for a confirm_action or form submit. */
  actionParams: { maxParams: 20 },
} as const

// ============================================================================
// COMPONENTS
// ============================================================================

export type AiCellValue = string | number | boolean | null

export interface AiTextComponent {
  type: 'text'
  text: string
}

export interface AiStatCard {
  label: string
  value: string
  hint?: string
}

export interface AiStatCardsComponent {
  type: 'stat_cards'
  items: AiStatCard[]
}

export interface AiTableColumn {
  key: string
  label: string
}

export interface AiTableComponent {
  type: 'table'
  columns: AiTableColumn[]
  /** Each row's keys must be column keys. */
  rows: Record<string, AiCellValue>[]
}

export interface AiListItem {
  title: string
  subtitle?: string
  href?: string
}

export interface AiListComponent {
  type: 'list'
  items: AiListItem[]
}

export type AiFieldKind = 'text' | 'number' | 'date' | 'select' | 'textarea'

export interface AiFormOption {
  value: string
  label: string
}

export interface AiFormField {
  name: string
  label: string
  kind: AiFieldKind
  required?: boolean
  /** Only for kind 'select'. */
  options?: AiFormOption[]
}

export interface AiFormComponent {
  type: 'form'
  fields: AiFormField[]
  submit: { label: string; actionId: string }
}

export interface AiActionCall {
  actionId: string
  params: Record<string, AiCellValue>
}

export interface AiConfirmActionComponent {
  type: 'confirm_action'
  title: string
  /** Plain statement of what will happen when confirmed. */
  summary: string
  action: AiActionCall
}

export interface AiLinkButtonComponent {
  type: 'link_button'
  label: string
  href: string
}

export interface AiNoticeComponent {
  type: 'notice'
  tone: 'info' | 'warning'
  text: string
}

export type AiComponent =
  | AiTextComponent
  | AiStatCardsComponent
  | AiTableComponent
  | AiListComponent
  | AiFormComponent
  | AiConfirmActionComponent
  | AiLinkButtonComponent
  | AiNoticeComponent

export interface AiResponse {
  components: AiComponent[]
}

export const AI_COMPONENT_TYPES = [
  'text',
  'stat_cards',
  'table',
  'list',
  'form',
  'confirm_action',
  'link_button',
  'notice',
] as const satisfies readonly AiComponent['type'][]

// ============================================================================
// ACTION REGISTRY
// ============================================================================

export type AiActionMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface AiActionDefinition {
  method: AiActionMethod
  /** Existing API route, e.g. '/attendance/:serviceId'. `:name` segments must be in `params`. */
  path: string
  /** Permission the signed-in user must already hold; the API still enforces it. */
  permission: PermissionAction
  /** Whitelist of param names the client may send. Anything else is dropped or refused. */
  params: readonly string[]
}

export type AiActionRegistry = Record<string, AiActionDefinition>

/**
 * Client-side registry of executable actions. Empty on purpose: no AI action
 * may run until a real entry is added and approved. Clients refuse any actionId
 * that is not a key here.
 *
 * EXAMPLE ONLY (not real, do not ship as-is):
 *   'attendance.record': {
 *     method: 'POST',
 *     path: '/attendance/:serviceId',
 *     permission: 'record:attendance', // must be a real PermissionAction
 *     params: ['serviceId', 'memberId', 'status'],
 *   },
 */
export const AI_ACTION_REGISTRY: AiActionRegistry = {}

// ============================================================================
// VALIDATION
// ============================================================================

export type AiValidationResult =
  | { ok: true; value: AiResponse }
  | { ok: false; errors: string[] }

const ACTION_ID_RE = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/
const KEY_RE = /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/
const TONES = ['info', 'warning'] as const
const FIELD_KINDS = ['text', 'number', 'date', 'select', 'textarea'] as const

type Obj = Record<string, unknown>

function isObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Reports every key of `o` that is not in `allowed`. */
function checkKeys(o: Obj, allowed: readonly string[], path: string, errors: string[]): void {
  for (const k of Object.keys(o)) {
    if (!allowed.includes(k)) errors.push(`${path}: unknown key '${k}'`)
  }
}

function checkString(
  v: unknown,
  path: string,
  maxChars: number,
  errors: string[],
  opts: { optional?: boolean } = {},
): boolean {
  if (v === undefined && opts.optional) return true
  if (typeof v !== 'string') {
    errors.push(`${path}: must be a string`)
    return false
  }
  if (v.trim().length === 0) {
    errors.push(`${path}: must not be empty`)
    return false
  }
  if (v.length > maxChars) {
    errors.push(`${path}: must be at most ${maxChars} characters (got ${v.length})`)
    return false
  }
  return true
}

function checkHref(v: unknown, path: string, errors: string[]): void {
  if (typeof v !== 'string') {
    errors.push(`${path}: must be a string`)
    return
  }
  if (v.length > AI_LIMITS.hrefMaxChars) {
    errors.push(`${path}: href too long`)
    return
  }
  // Must be a relative in-app path. Rejects absolute URLs, scheme URLs
  // (javascript:, data:, https:), protocol-relative '//host', and backslash
  // tricks such as '/\host' that browsers normalise to '//host'.
  if (!v.startsWith('/') || v.startsWith('//') || v.includes('\\') || /[\u0000- \u007f]/.test(v)) {
    errors.push(`${path}: must be a relative in-app path starting with '/' (got '${v.slice(0, 60)}')`)
  }
}

function checkActionId(v: unknown, path: string, errors: string[]): void {
  if (typeof v !== 'string' || !ACTION_ID_RE.test(v)) {
    errors.push(`${path}: must match 'area.action' (lowercase, e.g. 'attendance.record')`)
  }
}

function checkCellValue(v: unknown, path: string, errors: string[]): void {
  if (v === null || typeof v === 'boolean') return
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) errors.push(`${path}: number must be finite`)
    return
  }
  if (typeof v === 'string') {
    if (v.length > AI_LIMITS.summaryMaxChars) {
      errors.push(`${path}: must be at most ${AI_LIMITS.summaryMaxChars} characters`)
    }
    return
  }
  errors.push(`${path}: must be string, number, boolean or null`)
}

function checkParams(v: unknown, path: string, errors: string[]): void {
  if (!isObj(v)) {
    errors.push(`${path}: must be an object`)
    return
  }
  const keys = Object.keys(v)
  if (keys.length > AI_LIMITS.actionParams.maxParams) {
    errors.push(`${path}: at most ${AI_LIMITS.actionParams.maxParams} params`)
  }
  for (const k of keys) {
    if (!KEY_RE.test(k)) errors.push(`${path}: invalid param name '${k}'`)
    checkCellValue(v[k], `${path}.${k}`, errors)
  }
}

function checkArray(
  v: unknown,
  path: string,
  min: number,
  max: number,
  errors: string[],
): v is unknown[] {
  if (!Array.isArray(v)) {
    errors.push(`${path}: must be an array`)
    return false
  }
  if (v.length < min) errors.push(`${path}: needs at least ${min} item(s)`)
  if (v.length > max) errors.push(`${path}: at most ${max} items (got ${v.length})`)
  return true
}

function validateComponent(c: Obj, path: string, errors: string[]): void {
  switch (c.type) {
    case 'text': {
      checkKeys(c, ['type', 'text'], path, errors)
      checkString(c.text, `${path}.text`, AI_LIMITS.textMaxChars, errors)
      return
    }
    case 'stat_cards': {
      checkKeys(c, ['type', 'items'], path, errors)
      if (!checkArray(c.items, `${path}.items`, 1, AI_LIMITS.statCards.maxItems, errors)) return
      c.items.forEach((item, i) => {
        const p = `${path}.items[${i}]`
        if (!isObj(item)) {
  errors.push(`${p}: must be an object`)
  return
}
        checkKeys(item, ['label', 'value', 'hint'], p, errors)
        checkString(item.label, `${p}.label`, AI_LIMITS.labelMaxChars, errors)
        checkString(item.value, `${p}.value`, AI_LIMITS.labelMaxChars, errors)
        checkString(item.hint, `${p}.hint`, AI_LIMITS.summaryMaxChars, errors, { optional: true })
      })
      return
    }
    case 'table': {
      checkKeys(c, ['type', 'columns', 'rows'], path, errors)
      const keys: string[] = []
      if (checkArray(c.columns, `${path}.columns`, 1, AI_LIMITS.table.maxColumns, errors)) {
        c.columns.forEach((col, i) => {
          const p = `${path}.columns[${i}]`
          if (!isObj(col)) {
  errors.push(`${p}: must be an object`)
  return
}
          checkKeys(col, ['key', 'label'], p, errors)
          if (typeof col.key !== 'string' || !KEY_RE.test(col.key)) {
            errors.push(`${p}.key: must be a letter-led identifier (max 64 chars)`)
          } else if (keys.includes(col.key)) {
            errors.push(`${p}.key: duplicate column key '${col.key}'`)
          } else {
            keys.push(col.key)
          }
          checkString(col.label, `${p}.label`, AI_LIMITS.labelMaxChars, errors)
        })
      }
      if (checkArray(c.rows, `${path}.rows`, 0, AI_LIMITS.table.maxRows, errors)) {
        c.rows.forEach((row, i) => {
          const p = `${path}.rows[${i}]`
          if (!isObj(row)) {
  errors.push(`${p}: must be an object`)
  return
}
          for (const k of Object.keys(row)) {
            if (!keys.includes(k)) errors.push(`${p}: unknown column key '${k}'`)
            else checkCellValue(row[k], `${p}.${k}`, errors)
          }
        })
      }
      return
    }
    case 'list': {
      checkKeys(c, ['type', 'items'], path, errors)
      if (!checkArray(c.items, `${path}.items`, 1, AI_LIMITS.list.maxItems, errors)) return
      c.items.forEach((item, i) => {
        const p = `${path}.items[${i}]`
        if (!isObj(item)) {
  errors.push(`${p}: must be an object`)
  return
}
        checkKeys(item, ['title', 'subtitle', 'href'], p, errors)
        checkString(item.title, `${p}.title`, AI_LIMITS.labelMaxChars, errors)
        checkString(item.subtitle, `${p}.subtitle`, AI_LIMITS.summaryMaxChars, errors, { optional: true })
        if (item.href !== undefined) checkHref(item.href, `${p}.href`, errors)
      })
      return
    }
    case 'form': {
      checkKeys(c, ['type', 'fields', 'submit'], path, errors)
      if (checkArray(c.fields, `${path}.fields`, 1, AI_LIMITS.form.maxFields, errors)) {
        const names: string[] = []
        c.fields.forEach((f, i) => {
          const p = `${path}.fields[${i}]`
          if (!isObj(f)) {
  errors.push(`${p}: must be an object`)
  return
}
          checkKeys(f, ['name', 'label', 'kind', 'required', 'options'], p, errors)
          if (typeof f.name !== 'string' || !KEY_RE.test(f.name)) {
            errors.push(`${p}.name: must be a letter-led identifier (max 64 chars)`)
          } else if (names.includes(f.name)) {
            errors.push(`${p}.name: duplicate field name '${f.name}'`)
          } else {
            names.push(f.name)
          }
          checkString(f.label, `${p}.label`, AI_LIMITS.labelMaxChars, errors)
          if (!FIELD_KINDS.includes(f.kind as (typeof FIELD_KINDS)[number])) {
            errors.push(`${p}.kind: must be one of ${FIELD_KINDS.join(', ')}`)
          }
          if (f.required !== undefined && typeof f.required !== 'boolean') {
            errors.push(`${p}.required: must be a boolean`)
          }
          if (f.kind === 'select') {
            if (checkArray(f.options, `${p}.options`, 1, AI_LIMITS.form.maxOptions, errors)) {
              f.options.forEach((o, j) => {
                const q = `${p}.options[${j}]`
                if (!isObj(o)) {
  errors.push(`${q}: must be an object`)
  return
}
                checkKeys(o, ['value', 'label'], q, errors)
                checkString(o.value, `${q}.value`, AI_LIMITS.labelMaxChars, errors)
                checkString(o.label, `${q}.label`, AI_LIMITS.labelMaxChars, errors)
              })
            }
          } else if (f.options !== undefined) {
            errors.push(`${p}.options: only allowed for kind 'select'`)
          }
        })
      }
      if (!isObj(c.submit)) {
        errors.push(`${path}.submit: must be an object`)
      } else {
        checkKeys(c.submit, ['label', 'actionId'], `${path}.submit`, errors)
        checkString(c.submit.label, `${path}.submit.label`, AI_LIMITS.labelMaxChars, errors)
        checkActionId(c.submit.actionId, `${path}.submit.actionId`, errors)
      }
      return
    }
    case 'confirm_action': {
      checkKeys(c, ['type', 'title', 'summary', 'action'], path, errors)
      checkString(c.title, `${path}.title`, AI_LIMITS.labelMaxChars, errors)
      checkString(c.summary, `${path}.summary`, AI_LIMITS.summaryMaxChars, errors)
      if (!isObj(c.action)) {
        errors.push(`${path}.action: must be an object`)
      } else {
        checkKeys(c.action, ['actionId', 'params'], `${path}.action`, errors)
        checkActionId(c.action.actionId, `${path}.action.actionId`, errors)
        checkParams(c.action.params, `${path}.action.params`, errors)
      }
      return
    }
    case 'link_button': {
      checkKeys(c, ['type', 'label', 'href'], path, errors)
      checkString(c.label, `${path}.label`, AI_LIMITS.labelMaxChars, errors)
      checkHref(c.href, `${path}.href`, errors)
      return
    }
    case 'notice': {
      checkKeys(c, ['type', 'tone', 'text'], path, errors)
      if (!TONES.includes(c.tone as (typeof TONES)[number])) {
        errors.push(`${path}.tone: must be 'info' or 'warning'`)
      }
      checkString(c.text, `${path}.text`, AI_LIMITS.summaryMaxChars, errors)
      return
    }
    default:
      errors.push(
        `${path}.type: unknown component type ${JSON.stringify(c.type)} (allowed: ${AI_COMPONENT_TYPES.join(', ')})`,
      )
  }
}

/**
 * Validates an untrusted AI response. Returns the same object typed as AiResponse
 * on success, or every error found (with JSON-path-like locations) on failure.
 */
export function validateAiResponse(input: unknown): AiValidationResult {
  const errors: string[] = []
  if (!isObj(input)) return { ok: false, errors: ['$: must be an object'] }
  checkKeys(input, ['components'], '$', errors)
  if (checkArray(input.components, '$.components', 0, AI_LIMITS.maxComponents, errors)) {
    input.components.forEach((c, i) => {
      const p = `$.components[${i}]`
      if (!isObj(c)) {
  errors.push(`${p}: must be an object`)
  return
}
      validateComponent(c, p, errors)
    })
  }
  return errors.length === 0
    ? { ok: true, value: input as unknown as AiResponse }
    : { ok: false, errors }
}
