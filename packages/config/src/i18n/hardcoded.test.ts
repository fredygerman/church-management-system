import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const scanRoots = ['apps/mobile/app', 'apps/mobile/components', 'apps/web/app', 'apps/web/components']
const extensions = new Set(['.tsx', '.jsx'])
const baselinePath = resolve(process.cwd(), 'src/i18n/hardcoded-baseline.json')
const repoRoot = resolve(process.cwd(), '../..')

function filesUnder(directory: string): string[] {
  if (!existsSync(directory)) return []
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return filesUnder(path)
    return extensions.has(path.slice(path.lastIndexOf('.'))) ? [path] : []
  })
}

function countEnglishLiterals(source: string): number {
  const patterns = [
    /(?<!=)>\s*[A-Za-z][^<>{}]*\s*</g, // JSX text only; `=> void` is a type, not text
    /\b(?:placeholder|accessibilityLabel)\s*=\s*"([^"]*[A-Za-z][^"]*)"/g,
    /\bAlert\.alert\(\s*(['"])([^'"\n]*[A-Za-z][^'"\n]*)\1/g,
  ]
  return patterns.reduce((total, pattern) => total + [...source.matchAll(pattern)].length, 0)
}

test('hard-coded English string counts do not exceed the per-file baseline', () => {
  const baseline = JSON.parse(readFileSync(baselinePath, 'utf8')) as Record<string, number>
  const actual: Record<string, number> = {}
  for (const root of scanRoots) {
    for (const file of filesUnder(resolve(repoRoot, root))) {
      const count = countEnglishLiterals(readFileSync(file, 'utf8'))
      if (count > 0) actual[relative(repoRoot, file)] = count
    }
  }
  for (const [file, count] of Object.entries(actual)) {
    assert.ok(file in baseline, `new file has hard-coded English literals: ${file} (${count})`)
    assert.ok(count <= (baseline[file] ?? 0), `${file} has ${count} literals; baseline is ${baseline[file] ?? 0}`)
  }
})
