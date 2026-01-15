"use client"

import { useState } from "react"
import { 
  UserRole, 
  PERMISSION_MAP, 
  PERMISSION_METADATA,
  type PermissionAction 
} from "@church/config"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Info } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

const roleLabels: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: "Super Administrator",
  [UserRole.ADMIN]: "Administrator",
  [UserRole.BRANCH_ADMIN]: "Branch Administrator",
  [UserRole.ZONE_LEADER]: "Zone Leader",
  [UserRole.MEMBER]: "Member",
}

const roleDescriptions: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: "Full system access across all churches",
  [UserRole.ADMIN]: "Church-level administrator with full access",
  [UserRole.BRANCH_ADMIN]: "Branch administrator with limited admin access",
  [UserRole.ZONE_LEADER]: "Zone/small group leader with member management",
  [UserRole.MEMBER]: "Regular church member with basic access",
}

const categoryLabels: Record<string, string> = {
  member: "Members",
  visitor: "Visitors",
  zone: "Zones",
  family: "Families",
  visitation: "Visitation",
  admin: "Administration",
}

export function PermissionsViewer() {
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.ADMIN)

  const rolePermissions = PERMISSION_MAP[selectedRole] || []

  // Group permissions by category
  const groupedPermissions = rolePermissions.reduce((acc, permission) => {
    const metadata = PERMISSION_METADATA[permission]
    if (!acc[metadata.category]) {
      acc[metadata.category] = []
    }
    acc[metadata.category].push({ permission, metadata })
    return acc
  }, {} as Record<string, Array<{ permission: PermissionAction; metadata: typeof PERMISSION_METADATA[PermissionAction] }>>)

  // Get all roles for comparison
  const allRoles = Object.values(UserRole)

  return (
    <div className="space-y-6">
      {/* Role Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Role</CardTitle>
          <CardDescription>
            Choose a role to view its permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {allRoles.map((role) => (
                <SelectItem key={role} value={role}>
                  <div className="flex items-center gap-2">
                    <Shield className="size-4" />
                    {roleLabels[role]}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Alert>
            <Info className="size-4" />
            <AlertDescription>
              {roleDescriptions[selectedRole]}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Permissions View */}
      <Tabs defaultValue="grouped" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grouped">By Category</TabsTrigger>
          <TabsTrigger value="comparison">Role Comparison</TabsTrigger>
        </TabsList>

        {/* Grouped View */}
        <TabsContent value="grouped" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{roleLabels[selectedRole]} Permissions</span>
                <Badge variant="secondary">{rolePermissions.length} total</Badge>
              </CardTitle>
              <CardDescription>
                All permissions granted to this role
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
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
                            <Badge
                              variant={
                                metadata.riskLevel === "high"
                                  ? "destructive"
                                  : metadata.riskLevel === "medium"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs mt-1"
                            >
                              {metadata.riskLevel} risk
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comparison View */}
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permission Comparison</CardTitle>
              <CardDescription>
                Compare permissions across all roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-semibold">Permission</th>
                      {allRoles.map((role) => (
                        <th key={role} className="text-center p-2 font-semibold min-w-[120px]">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs">{roleLabels[role]}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(PERMISSION_METADATA).map(([permission, metadata]) => (
                      <tr key={permission} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          <div className="space-y-1">
                            <p className="font-medium">{metadata.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {metadata.description}
                            </p>
                          </div>
                        </td>
                        {allRoles.map((role) => {
                          const hasPermission = PERMISSION_MAP[role]?.includes(
                            permission as PermissionAction
                          )
                          return (
                            <td key={role} className="text-center p-2">
                              {hasPermission ? (
                                <Badge variant="default" className="text-xs">
                                  ✓
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
