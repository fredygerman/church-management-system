import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  decodeAccessClaims,
  isStaffRole,
  roleHasTabPermission,
  STAFF_TAB_PERMISSIONS,
  type StaffTabPermission,
} from "../lib/claims"

const ALL_TAB_PERMISSIONS: StaffTabPermission[] = ["read:member", "view:attendance", "manage:files"]

function fakeJwt(payload: unknown): string {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url")
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url")
  return `${header}.${body}.signature`
}

describe("decodeAccessClaims", () => {
  it("reads activeChurchId and activeRole from a token payload", () => {
    const claims = decodeAccessClaims(fakeJwt({ sub: "user-1", activeChurchId: "church-1", activeRole: "admin" }))
    assert.equal(claims.activeChurchId, "church-1")
    assert.equal(claims.activeRole, "admin")
  })

  it("handles base64url characters (- and _) in the payload", () => {
    // "???" encodes to "Pz8/" in standard base64, so the "/" must be read back correctly.
    const token = fakeJwt({ activeChurchId: "c???", activeRole: "zone_leader" })
    assert.match(token.split(".")[1], /[-_]/, "fixture should exercise the base64url translation")
    const claims = decodeAccessClaims(token)
    assert.equal(claims.activeChurchId, "c???")
    assert.equal(claims.activeRole, "zone_leader")
  })

  it("returns undefined for claims that are missing or not strings", () => {
    const claims = decodeAccessClaims(fakeJwt({ activeChurchId: 42, activeRole: null }))
    assert.equal(claims.activeChurchId, undefined)
    assert.equal(claims.activeRole, undefined)
  })

  it("returns empty claims for malformed tokens", () => {
    assert.deepEqual(decodeAccessClaims(""), {})
    assert.deepEqual(decodeAccessClaims("not-a-jwt"), {})
    assert.deepEqual(decodeAccessClaims("a.!!!.c"), {})
    assert.deepEqual(decodeAccessClaims("a.bm90IGpzb24.c"), {}) // base64 of "not json"
    assert.deepEqual(decodeAccessClaims(fakeJwt(null)), {}) // payload "null" throws on property access
  })
})

describe("isStaffRole", () => {
  it("treats the member role as not staff", () => {
    assert.equal(isStaffRole("member"), false)
  })

  it("treats leader and admin roles as staff", () => {
    for (const role of ["super_admin", "admin", "branch_admin", "zone_leader", "department_leader"]) {
      assert.equal(isStaffRole(role), true, role)
    }
  })

  it("treats a missing or empty role as not staff", () => {
    assert.equal(isStaffRole(undefined), false)
    assert.equal(isStaffRole(""), false)
  })
})

describe("roleHasTabPermission", () => {
  it("gives the member role no staff tab permissions", () => {
    for (const permission of ALL_TAB_PERMISSIONS) {
      assert.equal(roleHasTabPermission("member", permission), false, permission)
    }
  })

  it("matches STAFF_TAB_PERMISSIONS for every listed role", () => {
    const roles = Object.keys(STAFF_TAB_PERMISSIONS)
    assert.ok(roles.length > 0)
    for (const role of roles) {
      for (const permission of ALL_TAB_PERMISSIONS) {
        const expected = STAFF_TAB_PERMISSIONS[role].includes(permission)
        assert.equal(roleHasTabPermission(role, permission), expected, `${role} / ${permission}`)
      }
    }
  })

  it("grants a permission the map lists for a role", () => {
    const [role, permissions] = Object.entries(STAFF_TAB_PERMISSIONS)[0]
    assert.ok(permissions.length > 0)
    assert.equal(roleHasTabPermission(role, permissions[0]), true)
  })

  it("denies a permission the map does not list for a role", () => {
    const restricted = Object.entries(STAFF_TAB_PERMISSIONS).find(([, perms]) => perms.length < ALL_TAB_PERMISSIONS.length)
    assert.ok(restricted, "expected at least one role with fewer tab permissions")
    const [role, permissions] = restricted
    const missing = ALL_TAB_PERMISSIONS.find((p) => !permissions.includes(p))!
    assert.equal(roleHasTabPermission(role, missing), false)
  })

  it("denies unknown and missing roles", () => {
    assert.equal(roleHasTabPermission(undefined, "read:member"), false)
    assert.equal(roleHasTabPermission("visitor", "read:member"), false)
  })
})
