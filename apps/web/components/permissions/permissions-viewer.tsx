"use client"

import { useState } from "react"
import { 
  UserRole, 
  PERMISSION_MAP, 
  PERMISSION_METADATA,
  type MessageKey,
  type PermissionAction,
  type PermissionMetadata
} from "@church/config"
import { useT } from "@/components/i18n/locale-provider"
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

const roleLabels: Record<UserRole, MessageKey> = {
  [UserRole.SUPER_ADMIN]: "final.permissions.role.superAdmin",
  [UserRole.ADMIN]: "final.permissions.role.admin",
  [UserRole.BRANCH_ADMIN]: "final.permissions.role.branchAdmin",
  [UserRole.ZONE_LEADER]: "final.permissions.role.zoneLeader",
  [UserRole.DEPARTMENT_LEADER]: "final.permissions.role.departmentLeader",
  [UserRole.MEMBER]: "final.permissions.role.member",
}

const roleDescriptions: Record<UserRole, MessageKey> = {
  [UserRole.SUPER_ADMIN]: "final.permissions.roleDesc.superAdmin",
  [UserRole.ADMIN]: "final.permissions.roleDesc.admin",
  [UserRole.BRANCH_ADMIN]: "final.permissions.roleDesc.branchAdmin",
  [UserRole.ZONE_LEADER]: "final.permissions.roleDesc.zoneLeader",
  [UserRole.DEPARTMENT_LEADER]: "final.permissions.roleDesc.departmentLeader",
  [UserRole.MEMBER]: "final.permissions.roleDesc.member",
}

// Category labels reuse the profile page keys; the risk and attendance keys are sweep.b.
const categoryKeys: Record<string, MessageKey> = {
  member: "staff.profile.category.member",
  visitor: "staff.profile.category.visitor",
  zone: "staff.profile.category.zone",
  family: "staff.profile.category.family",
  visitation: "staff.profile.category.visitation",
  admin: "staff.profile.category.admin",
  attendance: "sweep.b.permission.category.attendance",
}

const riskKeys: Record<PermissionMetadata["riskLevel"], MessageKey> = {
  high: "sweep.b.permission.risk.high",
  medium: "sweep.b.permission.risk.medium",
  low: "sweep.b.permission.risk.low",
}

export function PermissionsViewer() {
  const { t } = useT()
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
          <CardTitle>{t("final.church.selectRole")}</CardTitle>
          <CardDescription>
            {t("final.church.roleHint")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder={t("final.permissions.selectRolePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {allRoles.map((role) => (
                <SelectItem key={role} value={role}>
                  <div className="flex items-center gap-2">
                    <Shield className="size-4" />
                    {t(roleLabels[role])}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Alert>
            <Info className="size-4" />
            <AlertDescription>
              {t(roleDescriptions[selectedRole])}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Permissions View */}
      <Tabs defaultValue="grouped" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grouped">{t("final.permissions.byCategory")}</TabsTrigger>
          <TabsTrigger value="comparison">{t("final.permissions.roleComparison")}</TabsTrigger>
        </TabsList>

        {/* Grouped View */}
        <TabsContent value="grouped" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t("final.permissions.heading", { role: t(roleLabels[selectedRole]) })}</span>
                <Badge variant="secondary">{t("final.permissions.total", { count: rolePermissions.length })}</Badge>
              </CardTitle>
              <CardDescription>
                {t("final.church.roleAllPermissions")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([category, permissions]) => (
                  <div key={category}>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Shield className="size-4" />
                      {categoryKeys[category] ? t(categoryKeys[category]) : category}
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
                              {t(metadata.labelKey)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t(metadata.descriptionKey)}
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
                              {t(riskKeys[metadata.riskLevel])}
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
              <CardTitle>{t("final.permissions.comparisonTitle")}</CardTitle>
              <CardDescription>
                {t("final.church.roleCompareHint")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-semibold">{t("final.permissions.permission")}</th>
                      {allRoles.map((role) => (
                        <th key={role} className="text-center p-2 font-semibold min-w-[120px]">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs">{t(roleLabels[role])}</span>
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
                            <p className="font-medium">{t(metadata.labelKey)}</p>
                            <p className="text-xs text-muted-foreground">
                              {t(metadata.descriptionKey)}
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
