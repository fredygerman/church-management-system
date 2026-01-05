import { members, type Member, type NewMember } from "./tables/members"
import { users, type User, type NewUser } from "./tables/user"
import { zones, type Zone, type NewZone } from "./tables/zones"
import { churches, type Church, type NewChurch } from "./tables/churches"
import { families, type Family, type NewFamily } from "./tables/families"
import { visitors, visitorFollowups, type Visitor, type NewVisitor, type VisitorFollowup, type NewVisitorFollowup } from "./tables/visitors"
import { memberZones, type MemberZone, type NewMemberZone } from "./tables/memberZones"

export {
  users,
  zones,
  members,
  churches,
  families,
  visitors,
  visitorFollowups,
  memberZones,
  // Type exports
  type User,
  type NewUser,
  type Member,
  type NewMember,
  type Zone,
  type NewZone,
  type Church,
  type NewChurch,
  type Family,
  type NewFamily,
  type Visitor,
  type NewVisitor,
  type VisitorFollowup,
  type NewVisitorFollowup,
  type MemberZone,
  type NewMemberZone,
}
