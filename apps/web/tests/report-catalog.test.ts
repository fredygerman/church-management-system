import { test } from "node:test"
import assert from "node:assert/strict"
import { PERMISSION_METADATA, dictionaries, type MessageKey } from "@church/config"
import { ATTENDANCE_MEASURES, REPORTS } from "../lib/report-catalog"

const englishKeys = dictionaries.en

function assertEnglishKey(key: string, where: string) {
  assert.ok(Object.hasOwn(englishKeys, key), `${where}: "${key}" is missing from the English dictionary`)
  assert.ok(englishKeys[key as MessageKey].trim().length > 0, `${where}: "${key}" is empty in English`)
}

test("every report has a unique href", () => {
  const hrefs = REPORTS.map((report) => report.href)
  assert.equal(new Set(hrefs).size, hrefs.length, `duplicate hrefs: ${hrefs.join(", ")}`)
})

test("every report has a titleKey and definitionKey present in the English dictionary", () => {
  for (const report of REPORTS) {
    assertEnglishKey(report.titleKey, `${report.href} titleKey`)
    assertEnglishKey(report.definitionKey, `${report.href} definitionKey`)
  }
})

test("every report lists at least one permission, and each is a real PermissionAction", () => {
  const knownActions = new Set(Object.keys(PERMISSION_METADATA))
  for (const report of REPORTS) {
    assert.ok(report.permissions.length > 0, `${report.href} has no permissions`)
    for (const permission of report.permissions) {
      assert.ok(knownActions.has(permission), `${report.href} lists unknown permission "${permission}"`)
    }
  }
})

test("every attendance measure has a labelKey and definitionKey present in the English dictionary", () => {
  assert.ok(ATTENDANCE_MEASURES.length > 0)
  for (const measure of ATTENDANCE_MEASURES) {
    assertEnglishKey(measure.labelKey, `measure "${measure.label}" labelKey`)
    assertEnglishKey(measure.definitionKey, `measure "${measure.label}" definitionKey`)
  }
})
