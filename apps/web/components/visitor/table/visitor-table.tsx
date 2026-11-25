"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { type getVisitors } from "@/actions/visitor"
import { convertVisitorToMember, deleteVisitor } from "@/actions/visitor"

import { useDataTable } from "@/hooks/use-data-table"
import { DataTable } from "@/components/data-table/data-table"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"
import { useT } from "@/components/i18n/locale-provider"

import { getVisitorColumns } from "./visitor-table-columns"

interface VisitorTableProps {
  visitorPromise: ReturnType<typeof getVisitors>
  churchId: string
  canConvert?: boolean
}

export function VisitorTable({ visitorPromise, churchId, canConvert = false }: VisitorTableProps) {
  const router = useRouter()
  const { t } = useT()
  const [isLoading, setIsLoading] = useState(false)
  
  // The action resolves to an array of visitors
  const visitors = React.use(visitorPromise) as any[]
  const pageCount = 1

  const handleConvert = React.useCallback(async (visitorId: string) => {
    const confirmed = window.confirm(t("sweep.a.visitors.confirmConvert"))
    if (!confirmed) return

    setIsLoading(true)
    try {
      await convertVisitorToMember({ churchId, visitorId })
      toast.success(t("sweep.a.visitors.converted"))
      router.refresh()
    } catch (error) {
      console.error("Error converting visitor:", error)
      toast.error(error instanceof Error ? error.message : t("sweep.a.visitors.convertError"))
    } finally {
      setIsLoading(false)
    }
  }, [churchId, router, t])

  const handleDelete = React.useCallback(async (visitorId: string) => {
    const confirmed = window.confirm(t("sweep.a.visitors.confirmDelete"))
    if (!confirmed) return

    setIsLoading(true)
    try {
      await deleteVisitor({ churchId, visitorId })
      toast.success(t("sweep.a.visitors.deleted"))
      router.refresh()
    } catch (error) {
      console.error("Error deleting visitor:", error)
      toast.error(error instanceof Error ? error.message : t("sweep.a.visitors.deleteError"))
    } finally {
      setIsLoading(false)
    }
  }, [churchId, router, t])

  const handlers = React.useMemo(() => ({
    onConvert: canConvert ? handleConvert : undefined,
    onDelete: handleDelete,
  }), [canConvert, handleConvert, handleDelete])

  const columns = React.useMemo(() => getVisitorColumns(churchId, t, handlers), [churchId, t, handlers])

  const { table } = useDataTable({
    data: visitors,
    columns,
    pageCount,
    defaultPerPage: 10,
    defaultSort: "createdAt.desc",
  })

  return (
    <div className="max-w-auto space-y-2.5 overflow-auto">
      <DataTableToolbar table={table}>
        {/* toolbar actions could go here */}
      </DataTableToolbar>
      <DataTable table={table} />
    </div>
  )
}
