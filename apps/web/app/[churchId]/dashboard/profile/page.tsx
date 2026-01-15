import { redirect } from "next/navigation"
import { getSession } from "@/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Shield, Mail, User, Calendar } from "lucide-react"
import { 
  UserRole, 
  PERMISSION_MAP, 
  PERMISSION_METADATA,
  type PermissionAction 
} from "@church/config"

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ churchId: string }>
}) {
  const { churchId } = await params
  const session = await getSession()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  const user = session.user
  const userRole = (user.role || UserRole.MEMBER) as UserRole
  const userPermissions = PERMISSION_MAP[userRole] || []

  // Group permissions by category
  const groupedPermissions = userPermissions.reduce((acc, permission) => {
    const metadata = PERMISSION_METADATA[permission]
    if (!acc[metadata.category]) {
      acc[metadata.category] = []
    }
    acc[metadata.category].push({ permission, metadata })
    return acc
  }, {} as Record<string, Array<{ permission: PermissionAction; metadata: typeof PERMISSION_METADATA[PermissionAction] }>>)

  const categoryLabels: Record<string, string> = {
    member: "Members",
    visitor: "Visitors",
    zone: "Zones",
    family: "Families",
    visitation: "Visitation",
    admin: "Administration",
  }

  const roleLabels: Record<UserRole, string> = {
    [UserRole.SUPER_ADMIN]: "Super Administrator",
    [UserRole.ADMIN]: "Administrator",
    [UserRole.BRANCH_ADMIN]: "Branch Administrator",
    [UserRole.ZONE_LEADER]: "Zone Leader",
    [UserRole.MEMBER]: "Member",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">
          View your account information and permissions
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>Your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="size-24">
                <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
                <AvatarFallback className="text-2xl">
                  {user.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="text-center space-y-1">
                <h3 className="font-semibold text-lg">{user.name}</h3>
                <Badge variant="secondary" className="font-mono">
                  {roleLabels[userRole]}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Shield className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Role</p>
                  <p className="text-sm text-muted-foreground">{roleLabels[userRole]}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">User ID</p>
                  <p className="text-sm text-muted-foreground font-mono truncate">
                    {user.id?.slice(0, 8)}...
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permissions Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>My Permissions</CardTitle>
            <CardDescription>
              Actions you are authorized to perform ({userPermissions.length} total)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(groupedPermissions).map(([category, permissions]) => (
                <div key={category}>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Shield className="size-4" />
                    {categoryLabels[category] || category}
                    <Badge variant="outline" className="ml-auto">
                      {permissions.length}
                    </Badge>
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {permissions.map(({ permission, metadata }) => (
                      <div
                        key={permission}
                        className="flex items-start gap-2 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {metadata.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {metadata.description}
                          </p>
                        </div>
                        <Badge
                          variant={
                            metadata.riskLevel === "high"
                              ? "destructive"
                              : metadata.riskLevel === "medium"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {metadata.riskLevel}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
