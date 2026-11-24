import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { validateAiResponse, AI_LIMITS } from './ai-components'

const resp = (components: unknown[]) => ({ components })

function assertOk(input: unknown) {
  const r = validateAiResponse(input)
  assert.equal(r.ok, true, r.ok ? '' : r.errors.join('; '))
}

function assertRejects(input: unknown, pattern: RegExp) {
  const r = validateAiResponse(input)
  assert.equal(r.ok, false, 'expected rejection')
  if (!r.ok) assert.ok(r.errors.some((e) => pattern.test(e)), `no error matching ${pattern}: ${r.errors.join('; ')}`)
}

describe('validateAiResponse: valid responses', () => {
  it('accepts an empty component list', () => assertOk({ components: [] }))

  it('accepts text', () => assertOk(resp([{ type: 'text', text: 'Hello' }])))

  it('accepts stat_cards with and without hint', () =>
    assertOk(resp([{ type: 'stat_cards', items: [{ label: 'Members', value: '120' }, { label: 'Visitors', value: '4', hint: 'this week' }] }])))

  it('accepts table with rows matching column keys', () =>
    assertOk(
      resp([
        {
          type: 'table',
          columns: [{ key: 'name', label: 'Name' }, { key: 'count', label: 'Count' }],
          rows: [{ name: 'Choir', count: 12 }, { name: 'Ushers', count: null }, { name: 'Youth', count: true }],
        },
      ]),
    ))

  it('accepts list with optional subtitle and relative href', () =>
    assertOk(resp([{ type: 'list', items: [{ title: 'Event', subtitle: 'Sunday', href: '/church/events/1' }, { title: 'Plain' }] }])))

  it('accepts form with select options and submit action', () =>
    assertOk(
      resp([
        {
          type: 'form',
          fields: [
            { name: 'note', label: 'Note', kind: 'textarea', required: true },
            { name: 'service', label: 'Service', kind: 'select', options: [{ value: 'am', label: 'Morning' }] },
            { name: 'day', label: 'Day', kind: 'date' },
            { name: 'count', label: 'Count', kind: 'number' },
            { name: 'title', label: 'Title', kind: 'text' },
          ],
          submit: { label: 'Save', actionId: 'attendance.record' },
        },
      ]),
    ))

  it('accepts confirm_action with primitive params', () =>
    assertOk(
      resp([
        {
          type: 'confirm_action',
          title: 'Record attendance',
          summary: 'Marks 12 people present at the 9am service.',
          action: { actionId: 'attendance.record', params: { serviceId: 'abc', count: 12, late: false, note: null } },
        },
      ]),
    ))

  it('accepts link_button with relative href', () =>
    assertOk(resp([{ type: 'link_button', label: 'Open events', href: '/church/events?tab=upcoming' }])))

  it('accepts notice with both tones', () =>
    assertOk(resp([{ type: 'notice', tone: 'info', text: 'Data as of today' }, { type: 'notice', tone: 'warning', text: 'Partial data' }])))
})

describe('validateAiResponse: structural rejections', () => {
  it('rejects unknown component type', () => assertRejects(resp([{ type: 'html', html: '<b>x</b>' }]), /unknown component type/))

  it('rejects extra key on a component', () =>
    assertRejects(resp([{ type: 'text', text: 'hi', style: 'bold' }]), /unknown key 'style'/))

  it('rejects extra top-level key', () =>
    assertRejects({ components: [], markdown: '# hi' }, /unknown key 'markdown'/))

  it('rejects extra key inside a nested item', () =>
    assertRejects(resp([{ type: 'list', items: [{ title: 'x', onClick: 'y' }] }]), /unknown key 'onClick'/))

  it('rejects non-object input', () => assertRejects('components', /must be an object/))

  it('rejects table row key that is not a column', () =>
    assertRejects(
      resp([{ type: 'table', columns: [{ key: 'a', label: 'A' }], rows: [{ a: 1, b: 2 }] }]),
      /unknown column key 'b'/,
    ))

  it('rejects object-valued table cell', () =>
    assertRejects(
      resp([{ type: 'table', columns: [{ key: 'a', label: 'A' }], rows: [{ a: { x: 1 } }] }]),
      /must be string, number, boolean or null/,
    ))

  it('rejects select field without options and options on non-select', () => {
    assertRejects(resp([{ type: 'form', fields: [{ name: 'a', label: 'A', kind: 'select' }], submit: { label: 'Go', actionId: 'x.y' } }]), /fields\[0\]\.options: must be an array/)
    assertRejects(resp([{ type: 'form', fields: [{ name: 'a', label: 'A', kind: 'text', options: [{ value: 'v', label: 'V' }] }], submit: { label: 'Go', actionId: 'x.y' } }]), /only allowed for kind 'select'/)
  })

  it('rejects invalid action id format', () =>
    assertRejects(resp([{ type: 'confirm_action', title: 'T', summary: 'S', action: { actionId: 'DeleteAll', params: {} } }]), /area\.action/))
})

describe('validateAiResponse: href rules', () => {
  const link = (href: string) => resp([{ type: 'link_button', label: 'Go', href }])

  it('rejects absolute https URL', () => assertRejects(link('https://evil.example/x'), /relative in-app path/))
  it('rejects javascript: href', () => assertRejects(link('javascript:alert(1)'), /relative in-app path/))
  it('rejects data: href', () => assertRejects(link('data:text/html,hi'), /relative in-app path/))
  it('rejects protocol-relative href', () => assertRejects(link('//evil.example/x'), /relative in-app path/))
  it('rejects backslash trick', () => assertRejects(link('/\\evil.example'), /relative in-app path/))
  it('rejects href without leading slash', () => assertRejects(link('church/events'), /relative in-app path/))
  it('rejects href with whitespace', () => assertRejects(link('/church/ events'), /relative in-app path/))
  it('rejects list item href that is absolute', () =>
    assertRejects(resp([{ type: 'list', items: [{ title: 'x', href: 'javascript:void(0)' }] }]), /items\[0\]\.href/))
})

describe('validateAiResponse: limits', () => {
  it('accepts text of exactly 280 characters', () =>
    assertOk(resp([{ type: 'text', text: 'a'.repeat(AI_LIMITS.textMaxChars) }])))

  it('rejects text over 280 characters', () =>
    assertRejects(resp([{ type: 'text', text: 'a'.repeat(281) }]), /at most 280 characters \(got 281\)/))

  it('rejects empty text', () => assertRejects(resp([{ type: 'text', text: '   ' }]), /must not be empty/))

  it('accepts a table with exactly 50 rows', () => {
    const rows = Array.from({ length: 50 }, (_, i) => ({ n: i }))
    assertOk(resp([{ type: 'table', columns: [{ key: 'n', label: 'N' }], rows }]))
  })

  it('rejects table over 50 rows', () => {
    const rows = Array.from({ length: 51 }, (_, i) => ({ n: i }))
    assertRejects(resp([{ type: 'table', columns: [{ key: 'n', label: 'N' }], rows }]), /at most 50 items \(got 51\)/)
  })

  it('rejects non-finite number cell', () =>
    assertRejects(resp([{ type: 'table', columns: [{ key: 'n', label: 'N' }], rows: [{ n: Number.NaN }] }]), /must be finite/))

  it('rejects more than the maximum number of components', () => {
    const many = Array.from({ length: AI_LIMITS.maxComponents + 1 }, () => ({ type: 'notice', tone: 'info', text: 'x' }))
    assertRejects(resp(many), /at most 20 items/)
  })

  it('rejects notice with unknown tone', () =>
    assertRejects(resp([{ type: 'notice', tone: 'error', text: 'x' }]), /tone: must be 'info' or 'warning'/))
})
