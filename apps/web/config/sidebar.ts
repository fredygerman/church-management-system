import {
  BarChart2,
  HelpCircle,
  MessageSquare,
  Settings,
  Users,
  Users2,
  type LucideIcon,
} from "lucide-react"

interface SidebarItem {
  title: string
  href: string
  icon: LucideIcon
  target?: string
  isHidden?: boolean
}

interface SidebarSection {
  title: string
  items: SidebarItem[]
}

export const sidebarConfig: SidebarSection[] = [
  {
    title: "Reporting",
    items: [
      {
        title: "Analysis",
        href: "/dashboard/analytics",
        icon: BarChart2,
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
      },
      {
        title: "Attendance",
        href: "/dashboard/members/attendance",
        icon: Users2,
      },
    ],
  },
  {
    title: "Settings",
    items: [
      {
        title: "Users",
        href: "/dashboard/settings/users",
        icon: Settings,
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
