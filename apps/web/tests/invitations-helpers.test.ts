import { test } from "node:test"
import assert from "node:assert/strict"
import {
  getCodeStatus,
  requestContactLine,
  validateCodeSettings,
} from "../components/invitations/invitation-helpers"

const NOW = new Date("2026-11-27T10:00:00Z")
const FUTURE = "2026-12-10T10:00:00Z"
const PAST = "2026-11-20T10:00:00Z"

test("getCodeStatus: a fresh code with uses left is active", () => {
  assert.equal(
    getCodeStatus({ expiresAt: FUTURE, maxUses: 50, uses: 3, revokedAt: null }, NOW),
    "active",
  )
})

test("getCodeStatus: a revoked code is revoked even when it has not expired", () => {
  assert.equal(
    getCodeStatus({ expiresAt: FUTURE, maxUses: 50, uses: 0, revokedAt: "2026-11-26T08:00:00Z" }, NOW),
    "revoked",
  )
})

test("getCodeStatus: an expired code is ended", () => {
  assert.equal(getCodeStatus({ expiresAt: PAST, maxUses: 50, uses: 0, revokedAt: null }, NOW), "ended")
})

test("getCodeStatus: a code at its use cap is ended", () => {
  assert.equal(getCodeStatus({ expiresAt: FUTURE, maxUses: 5, uses: 5, revokedAt: null }, NOW), "ended")
})

test("getCodeStatus: an unreadable expiry is ended, not active", () => {
  assert.equal(getCodeStatus({ expiresAt: "not-a-date", maxUses: 5, uses: 0, revokedAt: null }, NOW), "ended")
})

test("validateCodeSettings: accepts whole numbers at the API limits", () => {
  assert.deepEqual(validateCodeSettings({ maxUses: "1", validDays: "1" }), {
    ok: true,
    maxUses: 1,
    validDays: 1,
  })
  assert.deepEqual(validateCodeSettings({ maxUses: "500", validDays: "90" }), {
    ok: true,
    maxUses: 500,
    validDays: 90,
  })
  assert.deepEqual(validateCodeSettings({ maxUses: " 50 ", validDays: "14" }), {
    ok: true,
    maxUses: 50,
    validDays: 14,
  })
})

test("validateCodeSettings: rejects out-of-range and non-integer maxUses", () => {
  assert.deepEqual(validateCodeSettings({ maxUses: "0", validDays: "14" }), { ok: false, field: "maxUses" })
  assert.deepEqual(validateCodeSettings({ maxUses: "501", validDays: "14" }), { ok: false, field: "maxUses" })
  assert.deepEqual(validateCodeSettings({ maxUses: "2.5", validDays: "14" }), { ok: false, field: "maxUses" })
  assert.deepEqual(validateCodeSettings({ maxUses: "", validDays: "14" }), { ok: false, field: "maxUses" })
  assert.deepEqual(validateCodeSettings({ maxUses: "abc", validDays: "14" }), { ok: false, field: "maxUses" })
})

test("validateCodeSettings: rejects out-of-range validDays", () => {
  assert.deepEqual(validateCodeSettings({ maxUses: "50", validDays: "0" }), { ok: false, field: "validDays" })
  assert.deepEqual(validateCodeSettings({ maxUses: "50", validDays: "91" }), { ok: false, field: "validDays" })
  assert.deepEqual(validateCodeSettings({ maxUses: "50", validDays: "" }), { ok: false, field: "validDays" })
})

test("requestContactLine: joins email and phone, skipping missing values", () => {
  assert.equal(requestContactLine({ email: "a@b.org", phone: "+255700000000" }), "a@b.org · +255700000000")
  assert.equal(requestContactLine({ email: "a@b.org", phone: null }), "a@b.org")
  assert.equal(requestContactLine({ email: null, phone: "+255700000000" }), "+255700000000")
  assert.equal(requestContactLine({ email: "  ", phone: null }), "")
  assert.equal(requestContactLine({ email: null, phone: null }), "")
})
