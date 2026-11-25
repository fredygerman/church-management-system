import React from "react"
import Link from "next/link"
import { getOfferingCategories } from "@/actions/offering"
import { ensurePermission } from "@/lib/permissions-server"
import { getTranslator } from "@/lib/i18n/server"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface PageProps {
  params: Promise<{ churchId: string }>
}

async function CategoriesTable({
  categoriesPromise,
  churchId,
}: {
  categoriesPromise: ReturnType<typeof getOfferingCategories>
  churchId: string
}) {
  const t = await getTranslator()
  const categories = await categoriesPromise

  if (categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("staff.giving.categories.empty")}</p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("staff.common.name")}</TableHead>
          <TableHead>{t("staff.giving.description")}</TableHead>
          <TableHead className="w-24 text-right">{t("staff.giving.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((category) => (
          <TableRow key={category.id}>
            <TableCell className="font-medium">{category.name}</TableCell>
            <TableCell className="text-muted-foreground">{category.description || "—"}</TableCell>
            <TableCell className="text-right">
              <Link
                href={`/${churchId}/dashboard/offerings/categories/${category.id}/edit`}
                className="text-blue-600 hover:underline"
              >
                {t("staff.giving.edit")}
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default async function OfferingCategoriesPage({ params }: PageProps) {
  await ensurePermission("manage:offerings")
  const t = await getTranslator()
  const { churchId } = await params
  const categoriesPromise = getOfferingCategories(churchId)

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("staff.giving.categories.title")}</h2>
          <p className="text-muted-foreground">{t("staff.giving.categories.description")}</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href={`/${churchId}/dashboard/offerings`}>
            <Button variant="outline">{t("staff.giving.backToOfferings")}</Button>
          </Link>
          <Link href={`/${churchId}/dashboard/offerings/categories/add`}>
            <Button>{t("staff.giving.categories.add")}</Button>
          </Link>
        </div>
      </div>
      <Separator />

      <React.Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <CategoriesTable categoriesPromise={categoriesPromise} churchId={churchId} />
      </React.Suspense>
    </div>
  )
}
