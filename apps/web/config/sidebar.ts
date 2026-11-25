import {
  BarChart2,
  HelpCircle,
  MessageSquare,
  MapPin,
  Home,
  Users,
  Users2,
  Shield,
  UserCircle,
  ClipboardCheck,
  Megaphone,
  Database,
  HeartHandshake,
  Building2,
  HandCoins,
  CalendarDays,
  Library,
  MoreHorizontal,
  Sparkles,
  type LucideIcon,
} from "lucide-react"
import type { PermissionAction } from "@church/config"

// `title` holds a shared message key (common.ts `nav.*`), not English text.
interface SidebarItem {
  title: string
  href: string
  icon: LucideIcon
  target?: string
  isHidden?: boolean
  permissions?: PermissionAction[]
}

interface SidebarSection {
  title: string
  items: SidebarItem[]
}

export const sidebarConfig: SidebarSection[] = [
  {
    title: "nav.section.dashboard",
    items: [
      {
        title: "nav.home",
        href: "/dashboard/home",
        icon: Home,
      },
      {
        title: "nav.assistant",
        href: "/dashboard/ai",
        icon: Sparkles,
      },
    ],
  },
  {
    title: "nav.section.reporting",
    items: [
      {
        title: "nav.reports",
        href: "/dashboard/analytics",
        icon: BarChart2,
        permissions: ["manage:attendance-analytics"],
      },
      {
        title: "nav.attendance",
        href: "/dashboard/attendance",
        icon: ClipboardCheck,
        permissions: ["view:attendance", "manage:attendance"],
      },
      {
        title: "nav.communications",
        href: "/dashboard/communications",
        icon: Megaphone,
        permissions: ["view:communications", "manage:communications"],
      },
      {
        title: "nav.content",
        href: "/dashboard/content",
        icon: Library,
        permissions: ["manage:files"],
      },
      {
        title: "nav.dataQuality",
        href: "/dashboard/data-quality",
        icon: Database,
        permissions: ["view:data-quality", "manage:data-quality"],
      },
      {
        title: "nav.familyLifecycle",
        href: "/dashboard/family-lifecycle",
        icon: HeartHandshake,
        permissions: ["view:lifecycle-dashboard", "manage:lifecycle-rules"],
      },
      {
        title: "nav.attendanceV2",
        href: "/dashboard/attendance/v2",
        icon: ClipboardCheck,
        permissions: ["manage:attendance-analytics"],
      },
    ],
  },
  {
    title: "nav.section.members",
    items: [
      {
        title: "nav.members",
        href: "/dashboard/members",
        icon: Users,
        permissions: ["read:member"],
      },
      {
        title: "nav.zones",
        href: "/dashboard/zones",
        icon: MapPin,
        permissions: ["manage:zones"],
      },
      {
        title: "nav.departments",
        href: "/dashboard/departments",
        icon: Building2,
        permissions: ["read:department"],
      },
      {
        title: "nav.families",
        href: "/dashboard/families",
        icon: Users2,
        permissions: ["view:families", "manage:families"],
      },
      {
        title: "nav.visitors",
        href: "/dashboard/visitors",
        icon: Users2,
        permissions: ["view:visitors"],
      },
      {
        title: "nav.offerings",
        href: "/dashboard/offerings",
        icon: HandCoins,
        permissions: ["manage:offerings", "view:giving-reports", "manage:giving-goals"],
      },
      {
        title: "nav.events",
        href: "/dashboard/events",
        icon: CalendarDays,
        permissions: ["view:events"],
      },
    ],
  },
  {
    title: "nav.section.memberPortal",
    items: [
      {
        title: "nav.church",
        href: "/portal/church",
        icon: Building2,
      },
      {
        title: "nav.library",
        href: "/portal/library",
        icon: Library,
      },
      {
        title: "nav.assistant",
        href: "/portal/ai",
        icon: Sparkles,
      },
    ],
  },
  {
    title: "nav.section.settings",
    items: [
      {
        title: "nav.permissions",
        href: "/dashboard/permissions",
        icon: Shield,
        permissions: ["manage:users"],
      },
    ],
  },
  {
    title: "nav.section.account",
    items: [
      {
        title: "nav.myProfile",
        href: "/dashboard/profile",
        icon: UserCircle,
      },
      {
        title: "nav.more",
        href: "/dashboard/more",
        icon: MoreHorizontal,
      },
    ],
  },
  {
    title: "nav.section.support",
    items: [
      {
        title: "nav.documentation",
        href: "/docs",
        icon: MessageSquare,
        target: "_blank",
      },
      {
        title: "nav.contactUs",
        href: "/support",
        icon: HelpCircle,
        target: "_blank",
      },
    ],
  },
]
