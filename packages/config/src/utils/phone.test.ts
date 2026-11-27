import { test } from "node:test"
import assert from "node:assert/strict"
import { maskPhone, normalizeTzPhone } from "./phone"

test("normalizeTzPhone accepts local, international and spaced forms", () => {
  assert.equal(normalizeTzPhone("0712345678"), "+255712345678")
  assert.equal(normalizeTzPhone("255712345678"), "+255712345678")
  assert.equal(normalizeTzPhone("+255712345678"), "+255712345678")
  assert.equal(normalizeTzPhone("+255 712 345 678"), "+255712345678")
  assert.equal(normalizeTzPhone("0712-345-678"), "+255712345678")
  assert.equal(normalizeTzPhone("  +255.612.345.678 "), "+255612345678")
})

test("normalizeTzPhone rejects wrong lengths and non-mobile prefixes", () => {
  assert.equal(normalizeTzPhone("071234567"), null)
  assert.equal(normalizeTzPhone("07123456789"), null)
  assert.equal(normalizeTzPhone("0212345678"), null)
  assert.equal(normalizeTzPhone("+255812345678"), null)
})

test("normalizeTzPhone rejects other countries and bare numbers", () => {
  assert.equal(normalizeTzPhone("+254712345678"), null)
  assert.equal(normalizeTzPhone("712345678"), null)
})

test("normalizeTzPhone rejects letters, empty and missing input", () => {
  assert.equal(normalizeTzPhone("07123abc78"), null)
  assert.equal(normalizeTzPhone(""), null)
  assert.equal(normalizeTzPhone("   "), null)
  assert.equal(normalizeTzPhone(null), null)
  assert.equal(normalizeTzPhone(undefined), null)
})

test("maskPhone keeps only the last three digits visible", () => {
  assert.equal(maskPhone("+255712345678"), "+255******678")
  assert.equal(maskPhone("+255"), "***")
})
