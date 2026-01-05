import {
  BarChart2,
  HelpCircle,
  MessageSquare,
  Settings,
  Users,
  Users2,
  MapPin,
  Home,
  Users3,
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
        title: "Zones",
        href: "/dashboard/zones",
        icon: MapPin,
      },
      {
        title: "Families",
        href: "/dashboard/families",
        icon: Users3,
      },
      {
        title: "Visitors",
        href: "/dashboard/visitors",
        icon: Users2,
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
      },
      {
        title: "Users",
        href: "/dashboard/settings/users",
        icon: Users,
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
