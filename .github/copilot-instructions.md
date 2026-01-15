# Church Management System - Project Patterns

**Stack:** Next.js 14 (App Router) + NestJS + Drizzle ORM + PostgreSQL + Tailwind CSS + shadcn/ui  
**Monorepo:** pnpm workspaces + TurboRepo  
**Multi-tenancy:** Church-scoped with mandatory `churchId` context

## Monorepo Structure

```
apps/
  web/           # Next.js frontend
    app/         # App Router (pages in [churchId]/ for tenant isolation)
    actions/     # Server actions (domain-organized: zone.ts, member.ts)
    components/  # React components (ui/, zone/, member/, church/)
    lib/         # Utils (api-helpers.ts, api-client.ts)
  api/           # NestJS backend
    src/
      zones/, members/, churches/  # Feature modules
      auth/      # JWT guards, strategies, permissions
      database/  # Seeds
packages/
  db/            # Drizzle ORM (schema.ts, tables/, migrations/)
  config/        # Shared types, enums, utilities (no DTOs - API-specific)
```

**Key Principles:**
- Workspace packages referenced as `"@church/db": "workspace:*"`
- All operations scoped to `churchId` (enforced by guards + URL structure)
- Server Actions for data mutations, React Server Components for reads

## Frontend Patterns

### Page Component (App Router)
```tsx
// app/[churchId]/dashboard/zones/page.tsx
export default async function ZonesPage({ 
  params 
}: { 
  params: Promise<{ churchId: string }> 
}) {
  const { churchId } = await params
  const zones = await getZones(churchId)
  return <ZonesTable data={zones} churchId={churchId} />
}
```

### Server Action Pattern
```typescript
// actions/zone.ts
"use server"
import { revalidatePath } from "next/cache"
import { apiPost, apiGet } from "@/lib/api-helpers"

export async function createZone(churchId: string, data: CreateZoneData) {
  const zone = await apiPost("/zones", { ...data, churchId })
  revalidatePath(`/${churchId}/dashboard/zones`) // ⚠️ Always revalidate after mutations
  return zone
}

export async function getZones(churchId: string) {
  try {
    return await apiGet(`/zones?churchId=${churchId}`)
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error
    console.error("Error fetching zones:", error)
    return []
  }
}
```

### Dialog Component Pattern
```tsx
"use client"
interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CustomDialog({ open, onOpenChange, onSuccess }: DialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      await performAction()
      toast.success("Success")
      onSuccess?.()
      onOpenChange(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Title</DialogTitle>
        </DialogHeader>
        <Button onClick={handleSubmit} disabled={isLoading}>Submit</Button>
      </DialogContent>
    </Dialog>
  )
}
```

### Form with Zod Validation
```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(2),
})

export function ZoneForm() {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  })

  const onSubmit = async (values) => {
    const result = await createZone(values)
    if (result) toast.success("Created")
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit">Create</Button>
      </form>
    </Form>
  )
}
```


## Backend Patterns

### NestJS Module Structure
```typescript
// src/zones/zones.module.ts
@Module({
  controllers: [ZonesController],
  providers: [ZonesService],
  exports: [ZonesService],
})
export class ZonesModule {}
```

### Service Pattern
```typescript
// src/zones/zones.service.ts
import { Injectable } from "@nestjs/common"
import { eq, and, isNull } from "drizzle-orm"
import { db, zones, memberZones } from "@church/db"

@Injectable()
export class ZonesService {
  async createZone(data: CreateZoneInput): Promise<Zone> {
    const [zone] = await db.insert(zones).values(data).returning()
    return zone
  }

  async getZonesByChurch(churchId: string): Promise<Zone[]> {
    return db.query.zones.findMany({
      where: and(eq(zones.churchId, churchId), isNull(zones.deletedAt)),
    })
  }

  async getZoneMembers(zoneId: string): Promise<any[]> {
    const records = await db.query.memberZones.findMany({
      where: eq(memberZones.zoneId, zoneId),
      with: { member: true },
    })
    return records.map((r) => ({ ...r.member, isLeader: r.isLeader }))
  }
}
```

### Controller Pattern
```typescript
// src/zones/zones.controller.ts
@Controller("zones")
@UseGuards(JwtAuthGuard, ChurchContextGuard, PermissionGuard)
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @Post()
  @RequirePermissions("zone:create")
  async create(@Body() dto: CreateZoneDto) {
    return this.zonesService.createZone(dto)
  }

  @Get()
  @RequirePermissions("zone:read")
  async findAll(@Query("churchId") churchId: string) {
    return this.zonesService.getZonesByChurch(churchId)
  }

  @Get(":id/members")  // ⚠️ Specific routes BEFORE parameterized routes
  @RequirePermissions("zone:read")
  async getMembers(@Param("id") zoneId: string) {
    return this.zonesService.getZoneMembers(zoneId)
  }

  @Get(":id")  // ⚠️ Parameterized route comes last
  @RequirePermissions("zone:read")
  async findOne(@Param("id") id: string) {
    return this.zonesService.getZoneById(id)
  }
}
```

### Drizzle ORM Schema
```typescript
// packages/db/tables/zones.ts
export const zones = pgTable("zones", {
  id: uuid("id").defaultRandom().primaryKey(),
  churchId: uuid("church_id").notNull().references(() => churches.id),
  name: varchar("name", { length: 255 }).notNull(),
  leaderId: uuid("leader_id").references(() => members.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
})

// Junction table for many-to-many
export const memberZones = pgTable("member_zones", {
  id: uuid("id").defaultRandom().primaryKey(),
  memberId: uuid("member_id").notNull().references(() => members.id),
  zoneId: uuid("zone_id").notNull().references(() => zones.id),
  isLeader: boolean("is_leader").default(false),
  createdAt: timestamp("created_at").defaultNow(),
})
```


## Multi-Tenancy & Security

### Church Context
Every request must include `churchId`:
```typescript
// Frontend
await apiGet(`/zones?churchId=${churchId}`)
await apiPost("/zones", { ...data, churchId })

// Backend
@UseGuards(JwtAuthGuard, ChurchContextGuard)
```

### User Roles & Permissions
```typescript
enum UserRole {
  SUPER_ADMIN = "super_admin",     // Full access to all churches
  BRANCH_ADMIN = "branch_admin",   // Church administrator
  ZONE_LEADER = "ZONE_LEADER",     // Zone/small group leader
  MEMBER = "member",               // Regular church member
}

interface UserContext {
  id: string
  email: string
  role: UserRole
  churchId: string             // Mandatory church context
  assignedZoneId?: string      // For zone leaders
  workspaceId: string
  isActive: boolean
}
```


## Naming Conventions

### Frontend
- **Files**: kebab-case (`zone-detail.tsx`, `add-member-dialog.tsx`)
- **Components**: PascalCase (`ZoneDetail`, `AddMemberDialog`)
- **Props**: PascalCase + `Props` (`ZoneDetailProps`)
- **Hooks**: camelCase + `use` prefix (`useZoneData`)
- **Actions**: camelCase (`createZone`, `getZoneMembers`)

### Backend
- **Files**: kebab-case + suffix (`zones.service.ts`, `zones.controller.ts`)
- **Classes**: PascalCase (`ZonesService`, `ZonesController`)
- **Methods**: camelCase (`createZone`, `getZoneMembers`)
- **Tables**: snake_case (`zones`, `member_zones`)

### General
- **Folders**: kebab-case
- **Env vars**: SCREAMING_SNAKE_CASE (`DATABASE_URL`, `JWT_SECRET`)
- **Booleans**: Prefix with `is`, `has`, `should` (`isLoading`, `hasPermission`)
- **Arrays**: Plural (`zones`, `members`)
- **Objects**: Singular (`zone`, `member`)

## Import Order

### Frontend
```typescript
// 1. React/Next.js
import { useState } from "react"
import { revalidatePath } from "next/cache"

// 2. Third-party
import { toast } from "sonner"
import { z } from "zod"

// 3. Workspace packages
import { db } from "@church/db"

// 4. Actions
import { getZones } from "@/actions/zone"

// 5. Components
import { Button } from "@/components/ui/button"

// 6. Utils & types
import { cn } from "@/lib/utils"
import type { Zone } from "@/types"
```

### Backend
```typescript
// 1. NestJS
import { Injectable } from "@nestjs/common"

// 2. Third-party
import { eq, and } from "drizzle-orm"

// 3. Workspace packages
import { db, zones } from "@church/db"

// 4. Local modules
import { AuthGuard } from "@/auth/guards/auth.guard"

// 5. Types
import type { Zone } from "./types"
```


## Package Management & Scripts

### Root Scripts
```json
{
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "web:dev": "pnpm --filter web dev",
    "api:dev": "pnpm --filter api dev",
    "db:push": "pnpm --filter @church/db db:push",
    "db:generate": "pnpm --filter @church/db db:generate",
    "db:migrate": "pnpm --filter @church/db db:migrate",
    "db:seed": "pnpm --filter @church/db db:seed",
    "db:studio": "pnpm --filter @church/db db:studio"
  }
}
```

### Using Workspace Packages

```typescript
// Backend - Import from shared packages
import { db, zones, members } from "@church/db"
import type { Zone } from "@church/config"
// DTOs are defined locally in apps/api/src/*/dtos/*.ts

// Frontend - Import from shared packages
import type { Zone } from "@church/config"
// Frontend uses types from @church/config only, not DTOs
```

## State Management

### DTOs vs Types

**Important:** DTOs are **API-specific only** and should never be in shared packages:

- **DTOs** (Data Transfer Objects): Backend request/response validation using class-validator
  - Location: `apps/api/src/*/dtos/*.ts`
  - Use: NestJS controllers for request validation
  - Never import in frontend
  
- **Types**: Shared database types and interfaces
  - Location: `packages/config/src/types/`
  - Use: Both frontend and backend for typing data
  - Re-exported from `@church/db` (source of truth)

```typescript
// ✅ Backend only
import { CreateVisitorDto } from './dtos/visitors'

// ✅ Frontend AND Backend
import type { Visitor, VisitorFollowup } from '@church/config'
```

### Frontend
- **Local state**: `useState`, `useReducer`
- **Server state**: Server Actions + React Server Components
- **Form state**: React Hook Form + Zod validation
- **URL state**: `searchParams` for filters and pagination
- **Global state**: React Context or Zustand (use sparingly)

### Backend
- **Dependency Injection**: NestJS DI container
- **Database**: Drizzle ORM with PostgreSQL
- **Config**: NestJS ConfigModule with environment variables

## Styling & UI

- **Framework**: Tailwind CSS (utility-first)
- **Components**: shadcn/ui base components
- **Icons**: Lucide React
- **Responsive**: Mobile-first (`sm:`, `md:`, `lg:`)
- **Utility**: `cn()` for conditional classes

```tsx
<div className={cn(
  "base-class",
  variant === "primary" && "text-blue-600",
  isActive && "font-bold",
  className
)} />
```

## API Communication

### Frontend Helpers
```typescript
// lib/api-helpers.ts
apiGet<T>(endpoint, params?)
apiPost<T>(endpoint, data?)
apiPut<T>(endpoint, data?)
apiDelete<T>(endpoint)

// Usage
const zones = await apiGet(`/zones?churchId=${churchId}`)
const zone = await apiPost("/zones", { name, churchId })
```

### Backend Response Format
```typescript
// Success response
{ "id": "uuid", "name": "Zone Name", "churchId": "uuid" }

// Array response
[{ "id": "uuid", "name": "Zone 1" }]
```

## Database & ORM

- **Database**: PostgreSQL
- **ORM**: Drizzle ORM (type-safe queries)
- **Migrations**: `pnpm db:generate`, `pnpm db:push`
- **Seeds**: TypeScript files in `packages/db/seeds/`

### Query Patterns
```typescript
// Relational query
const zones = await db.query.zones.findMany({
  where: and(eq(zones.churchId, churchId), isNull(zones.deletedAt)),
  with: { leader: true, members: true },
})

// Direct query
const [zone] = await db.insert(zones).values({ name, churchId }).returning()
```

## Error Handling

### Frontend
```typescript
try {
  const result = await createZone(data)
  toast.success("Zone created")
  return result
} catch (error) {
  if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error
  console.error("Error:", error)
  toast.error("Failed to create zone")
  throw error
}
```

### Backend
```typescript
import { NotFoundException, BadRequestException } from "@nestjs/common"

async findOne(id: string) {
  const zone = await this.zonesService.getZoneById(id)
  if (!zone) throw new NotFoundException(`Zone with ID ${id} not found`)
  return zone
}
```

## Development Workflow

```bash
# Start development
pnpm dev              # Start all apps
pnpm web:dev          # Frontend only
pnpm api:dev          # Backend only

# Database
pnpm db:generate      # Generate migrations
pnpm db:push          # Push schema changes
pnpm db:seed          # Seed data
pnpm db:studio        # Open Drizzle Studio

# Code quality
pnpm lint             # Lint all packages
pnpm type-check       # TypeScript check
pnpm build            # Build all
```

## Documentation Guidelines

**⚠️ Minimize Documentation Creation**

- **Avoid creating summary documents** - Write code, not documentation
- **Maximum 1-2 documents** per major feature/change, and only if absolutely necessary
- **Be direct and concise** - No huge documents or verbose explanations
- **Prefer inline comments** over separate documentation files
- **Update existing docs** rather than creating new ones

**When documentation is needed:**
- Keep it short and actionable (< 50 lines ideal, max 150 lines)
- Use bullet points, not paragraphs
- Include only essential information: what changed, why, and how to use it
- Skip obvious explanations and filler content


## Key Patterns for This Project

### 1. Church Context is Mandatory

Every operation must be scoped to a church:

```typescript
// ✅ Always include churchId
getZones(churchId)
createZone({ ...data, churchId })

// Frontend routes include churchId
/[churchId]/dashboard/zones
```

### 2. Auto-Assignment Patterns

When creating resources with ownership:

```typescript
async createZone(data: CreateZoneInput) {
  const session = await getSession()
  
  const [zone] = await db.insert(zones)
    .values({
      ...data,
      leaderId: session.user.id, // Auto-assign creator as leader
    })
    .returning()
  
  // Also create membership record
  await db.insert(memberZones).values({
    zoneId: zone.id,
    memberId: session.user.id,
    isLeader: true,
  })
  
  return zone
}
```

### 3. Validation Workflows

For critical operations requiring validation:

```typescript
// Don't allow leader removal without replacement
async removeMemberFromZone(zoneId: string, memberId: string, newLeaderId?: string) {
  const zone = await this.getZoneById(zoneId)
  
  if (zone.leaderId === memberId && !newLeaderId) {
    throw new BadRequestException(
      "Cannot remove zone leader without assigning a new leader"
    )
  }
  
  // Update leader if provided
  if (newLeaderId) {
    await this.updateZone(zoneId, { leaderId: newLeaderId })
  }
  
  // Remove member
  await db.delete(memberZones)
    .where(and(
      eq(memberZones.zoneId, zoneId),
      eq(memberZones.memberId, memberId)
    ))
}
```

---

**Always follow these patterns for consistent, maintainable, and scalable code. When in doubt, refer to existing patterns in the codebase and keep code DRY and modular.**
