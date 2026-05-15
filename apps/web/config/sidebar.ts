import {
  BarChart2,
  HelpCircle,
  MessageSquare,
  Settings,
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
  type LucideIcon,
} from "lucide-react"
import type { PermissionAction } from "@church/config"

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
    title: "Dashboard",
    items: [
      {
        title: "Home",
        href: "/dashboard/home",
        icon: Home,
      },
    ],
  },
  {
    title: "Reporting",
    items: [
      {
        title: "Analytics",
        href: "/dashboard/analytics",
        icon: BarChart2,
        permissions: ["manage:attendance-analytics"],
      },
      {
        title: "Attendance",
        href: "/dashboard/attendance",
        icon: ClipboardCheck,
        permissions: ["view:attendance", "manage:attendance"],
      },
      {
        title: "Communications",
        href: "/dashboard/communications",
        icon: Megaphone,
        permissions: ["view:communications", "manage:communications"],
      },
      {
        title: "Data Quality",
        href: "/dashboard/data-quality",
        icon: Database,
        permissions: ["view:data-quality", "manage:data-quality"],
      },
      {
        title: "Family Lifecycle",
        href: "/dashboard/family-lifecycle",
        icon: HeartHandshake,
        permissions: ["view:lifecycle-dashboard", "manage:lifecycle-rules"],
      },
      {
        title: "Attendance V2",
        href: "/dashboard/attendance/v2",
        icon: ClipboardCheck,
        permissions: ["manage:attendance-analytics"],
      },
    ],
  },
  {
    title: "Members",
    items: [
      {
        title: "Members",
        href: "/dashboard/members",
        icon: Users,
        permissions: ["read:member"],
      },
      {
        title: "Zones",
        href: "/dashboard/zones",
        icon: MapPin,
        permissions: ["manage:zones"],
      },
      {
        title: "Families",
        href: "/dashboard/families",
        icon: Users2,
        permissions: ["view:families", "manage:families"],
      },
      {
        title: "Visitors",
        href: "/dashboard/visitors",
        icon: Users2,
        permissions: ["view:visitors"],
      },
    ],
  },
  {
    title: "Settings",
    items: [
      {
        title: "Church Settings",
        href: "/dashboard/settings/church",
        icon: Settings,
        permissions: ["manage:settings", "manage:churches"],
      },
      {
        title: "Users",
        href: "/dashboard/settings/users",
        icon: Users,
        permissions: ["view:users", "manage:users"],
      },
      {
        title: "Permissions",
        href: "/dashboard/permissions",
        icon: Shield,
        permissions: ["manage:users"],
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        title: "My Profile",
        href: "/dashboard/profile",
        icon: UserCircle,
      },
    ],
  },
  {
    title: "Support",
    items: [
      {
        title: "Documentation",
        href: "/docs",
        icon: MessageSquare,
        target: "_blank",
      },
      {
        title: "Contact Us",
        href: "/support",
        icon: HelpCircle,
        target: "_blank",
      },
    ],
  },
]
