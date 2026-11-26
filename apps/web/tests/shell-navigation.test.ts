import { test } from "node:test"
import assert from "node:assert/strict"
import {
  churchPath,
  isSafeInternalPath,
  isStaffRole,
  postSignInPath,
  spaceDestinations,
} from "../lib/shell/navigation"

test("churchPath never builds a path without church context", () => {
  assert.equal(churchPath(undefined, "dashboard/profile"), null)
  assert.equal(churchPath("  ", "dashboard/profile"), null)
  assert.equal(churchPath("abc", "dashboard/profile"), "/abc/dashboard/profile")
})

test("staff space is hidden for ordinary members and shows five destinations for staff", () => {
  assert.deepEqual(spaceDestinations("staff", "abc", "member"), [])
  const staff = spaceDestinations("staff", "abc", "branch_admin")
  assert.equal(staff.length, 5)
  assert.ok(staff.every((item) => item.href.startsWith("/abc/dashboard/")))
  assert.equal(spaceDestinations("member", "abc", "member").length, 5)
})

test("staff status depends on role, not on a missing or read-only role", () => {
  assert.equal(isStaffRole("member"), false)
  assert.equal(isStaffRole(undefined), false)
  assert.equal(isStaffRole("admin"), true)
})

test("unsafe callback paths are rejected", () => {
  assert.equal(isSafeInternalPath("//evil.example"), false)
  assert.equal(isSafeInternalPath("/\\evil.example"), false)
  assert.equal(isSafeInternalPath("https://evil.example"), false)
  assert.equal(isSafeInternalPath("/abc/portal\nx"), false)
  assert.equal(isSafeInternalPath("/abc/portal"), true)
})

test("sign-in landing: safe callback wins, else role decides space", () => {
  assert.equal(postSignInPath({ callbackUrl: "/abc/events", churchId: "abc", role: "member" }), "/abc/events")
  assert.equal(postSignInPath({ callbackUrl: "//evil", churchId: "abc", role: "admin" }), "/abc/dashboard/home")
  assert.equal(postSignInPath({ churchId: "abc", role: "member" }), "/abc/portal")
  assert.equal(postSignInPath({ churchId: "abc", role: "admin" }), "/abc/dashboard/home")
  assert.equal(postSignInPath({ churchId: null, role: "admin" }), "/setup")
})
