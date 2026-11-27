import {
  DOC_V1_MAX_IMAGES,
  DOC_V1_MAX_TEXT_CHARS,
  isSafeHttpsUrl,
  validateDocV1,
} from './doc-v1.validator'

const UUID = '6f1c2a9e-3b4d-4e5f-8a7b-9c0d1e2f3a4b'

const doc = (...content: unknown[]) => ({ type: 'doc', content })
const paragraph = (...content: unknown[]) => ({ type: 'paragraph', content })
const text = (value: string, marks?: unknown[]) => (marks ? { type: 'text', text: value, marks } : { type: 'text', text: value })
const link = (href: string) => ({ type: 'link', attrs: { href } })
const image = (attrs: Record<string, unknown> = { attachmentId: UUID, alt: 'Hall setup' }) => ({ type: 'image', attrs })

function expectRejected(body: unknown, pattern: RegExp) {
  const result = validateDocV1(body)
  expect(result.ok).toBe(false)
  if (result.ok === true) return
  expect(result.issues.join(' | ')).toMatch(pattern)
}

describe('validateDocV1 accepts the allow-listed shape', () => {
  it('accepts the contract example (heading, bold run, image)', () => {
    const body = doc(
      { type: 'heading', attrs: { level: 2 }, content: [text('Karibuni wote')] },
      paragraph(text('Join us at '), text('6 pm', [{ type: 'bold' }])),
      image(),
    )
    expect(validateDocV1(body).ok).toBe(true)
  })

  it('accepts italic, https links, lists and blockquotes', () => {
    const body = doc(
      paragraph(text('Read ', []), text('this', [{ type: 'italic' }, { type: 'bold' }]), text(' here', [link('https://church.example/news')])),
      { type: 'bulletList', content: [{ type: 'listItem', content: [paragraph(text('One'))] }] },
      { type: 'orderedList', content: [{ type: 'listItem', content: [paragraph(text('Two'))] }] },
      { type: 'blockquote', content: [paragraph(text('Quoted'))] },
      { type: 'heading', attrs: { level: 1 }, content: [text('Title')] },
    )
    expect(validateDocV1(body).ok).toBe(true)
  })

  it('accepts an empty document', () => {
    expect(validateDocV1(doc()).ok).toBe(true)
  })
})

describe('validateDocV1 rejects anything outside the allow-list', () => {
  it('rejects non-object bodies', () => {
    expectRejected('<p>hello</p>', /must be a document object/)
    expectRejected(null, /must be a document object/)
    expectRejected([doc()], /must be a document object/)
  })

  it('rejects a root that is not a doc', () => {
    expectRejected({ type: 'paragraph', content: [text('x')] }, /root must be a doc/)
  })

  it('rejects raw HTML and script nodes', () => {
    expectRejected(doc({ type: 'html', value: '<img src=x onerror=alert(1)>' }), /unsupported node type "html"/)
    expectRejected(doc({ type: 'script', text: 'alert(1)' }), /unsupported node type "script"/)
    expectRejected(doc({ type: 'rawHtml', attrs: { html: '<b>x</b>' } }), /unsupported node type "rawHtml"/)
  })

  it('rejects markup smuggled into text nodes', () => {
    expectRejected(doc(paragraph(text('<script>alert(1)</script>'))), /markup is not allowed in text/)
    expectRejected(doc(paragraph(text('<img src=x onerror=alert(1)>'))), /markup is not allowed in text/)
    expectRejected(doc(paragraph(text('</p><p onmouseover=alert(1)>'))), /markup is not allowed in text/)
  })

  it('rejects javascript:, data:, http: and protocol-relative links', () => {
    expectRejected(doc(paragraph(text('x', [link('javascript:alert(1)')]))), /absolute https URLs/)
    expectRejected(doc(paragraph(text('x', [link('data:text/html,<script>alert(1)</script>')]))), /absolute https URLs/)
    expectRejected(doc(paragraph(text('x', [link('http://church.example')]))), /absolute https URLs/)
    expectRejected(doc(paragraph(text('x', [link('//evil.example')]))), /absolute https URLs/)
    expectRejected(doc(paragraph(text('x', [link('java\tscript:alert(1)')]))), /absolute https URLs/)
  })

  it('rejects marks outside bold, italic and link', () => {
    expectRejected(doc(paragraph(text('x', [{ type: 'underline' }]))), /unsupported mark "underline"/)
    expectRejected(doc(paragraph(text('x', [{ type: 'code' }]))), /unsupported mark "code"/)
    expectRejected(doc(paragraph(text('x', [{ type: 'bold', attrs: { style: 'color:red' } }]))), /bold marks do not take attrs/)
  })

  it('rejects headings other than level 1 or 2', () => {
    expectRejected(doc({ type: 'heading', attrs: { level: 3 }, content: [text('x')] }), /heading level must be 1 or 2/)
    expectRejected(doc({ type: 'heading', content: [text('x')] }), /heading attrs must be/)
  })

  it('rejects images without a UUID attachmentId or with a src', () => {
    expectRejected(doc(image({ attachmentId: 'not-a-uuid' })), /attachmentId must be a UUID/)
    expectRejected(doc(image({ attachmentId: UUID, src: 'https://evil.example/a.png' })), /image attr "src" is not allowed/)
    expectRejected(doc(image({ attachmentId: UUID, alt: 'x'.repeat(501) })), /alt must be text/)
  })

  it('rejects more than 10 images', () => {
    const images = Array.from({ length: DOC_V1_MAX_IMAGES + 1 }, () => image())
    expectRejected(doc(...images), /at most 10 images/)
    expect(validateDocV1(doc(...images.slice(0, DOC_V1_MAX_IMAGES))).ok).toBe(true)
  })

  it('rejects unknown keys on any node, which closes the door on injected properties', () => {
    expectRejected(doc({ type: 'paragraph', content: [text('x')], onclick: 'alert(1)' }), /"onclick" is not allowed on paragraph/)
    expectRejected(doc(paragraph(text('x')), { type: 'paragraph', content: [], style: 'x' }), /"style" is not allowed/)
  })

  it('rejects nodes placed where they are not allowed', () => {
    expectRejected(doc(paragraph(image())), /image cannot appear inside paragraph/)
    expectRejected(doc({ type: 'listItem', content: [paragraph(text('x'))] }), /listItem cannot appear inside doc/)
    expectRejected(doc({ type: 'bulletList', content: [paragraph(text('x'))] }), /paragraph cannot appear inside bulletList/)
  })

  it('rejects attrs on nodes that take none', () => {
    expectRejected(doc({ type: 'paragraph', attrs: { align: 'center' }, content: [text('x')] }), /paragraph nodes do not take attrs/)
  })

  it('rejects marks on non-text nodes', () => {
    expectRejected(doc({ type: 'paragraph', marks: [{ type: 'bold' }], content: [text('x')] }), /marks are only allowed on text/)
  })

  it('rejects empty text and text carrying content', () => {
    expectRejected(doc(paragraph(text(''))), /non-empty text/)
    expectRejected(doc(paragraph({ type: 'text', text: 'x', content: [] })), /text nodes cannot have content/)
  })

  it('rejects nesting deeper than six levels', () => {
    const deep = doc({
      type: 'blockquote',
      content: [{
        type: 'bulletList',
        content: [{
          type: 'listItem',
          content: [{
            type: 'bulletList',
            content: [{ type: 'listItem', content: [paragraph(text('too deep'))] }],
          }],
        }],
      }],
    })
    expectRejected(deep, /nested deeper than 6 levels/)
  })

  it('rejects more than 20 000 characters of text in total', () => {
    const long = 'a'.repeat(DOC_V1_MAX_TEXT_CHARS + 1)
    expectRejected(doc(paragraph(text(long))), /exceeds 20000 characters/)
    expect(validateDocV1(doc(paragraph(text('a'.repeat(DOC_V1_MAX_TEXT_CHARS))))).ok).toBe(true)
  })

  it('rejects bodies over 64 KB before walking them', () => {
    // Control characters serialise as six bytes each, so 20 000 of them exceed 64 KB while staying under the text cap.
    const heavy = doc(paragraph(text('\u0001'.repeat(DOC_V1_MAX_TEXT_CHARS))))
    expectRejected(heavy, /exceeds 64 KB/)
  })

  it('reports at most five issues', () => {
    const body = doc(
      { type: 'html' }, { type: 'script' }, { type: 'iframe' }, { type: 'object' },
      { type: 'embed' }, { type: 'style' }, { type: 'form' },
    )
    const result = validateDocV1(body)
    expect(result.ok).toBe(false)
    if (result.ok === false) expect(result.issues.length).toBeLessThanOrEqual(5)
  })
})

describe('isSafeHttpsUrl', () => {
  it.each([
    ['https://church.example', true],
    ['https://church.example/path?q=1#frag', true],
    ['http://church.example', false],
    ['javascript:alert(1)', false],
    ['JaVaScRiPt:alert(1)', false],
    ['data:text/plain,hi', false],
    ['vbscript:msgbox', false],
    ['https://', false],
    ['https://exa mple.org', false],
    ['', false],
    [42, false],
    [undefined, false],
  ])('%s -> %s', (href, expected) => {
    expect(isSafeHttpsUrl(href)).toBe(expected)
  })
})
