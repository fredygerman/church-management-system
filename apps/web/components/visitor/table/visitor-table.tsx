"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { type getVisitors } from "@/actions/visitor"
import { convertVisitorToMember } from "@/actions/visitor"

import { useDataTable } from "@/hooks/use-data-table"
import { DataTable } from "@/components/data-table/data-table"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"

import { getVisitorColumns } from "./visitor-table-columns"

interface VisitorTableProps {
  visitorPromise: ReturnType<typeof getVisitors>
  churchId: string
}

export function VisitorTable({ visitorPromise, churchId }: VisitorTableProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  // The action resolves to an array of visitors
  const visitors = React.use(visitorPromise) as any[]
  const pageCount = 1

  const handleConvert = async (visitorId: string) => {
    setIsLoading(true)
    try {
      await convertVisitorToMember({ churchId, visitorId })
      toast.success("Visitor converted to member successfully")
      router.refresh()
    } catch (error) {
      console.error("Error converting visitor:", error)
      toast.error(error instanceof Error ? error.message : "Failed to convert visitor")
    } finally {
      setIsLoading(false)
    }
  }

  const handlers = {
    onConvert: handleConvert,
    onDelete: async (visitorId: string) => {
      // TODO: Implement delete handler
      toast.info("Delete functionality coming soon")
    },
  }

  const columns = React.useMemo(() => getVisitorColumns(churchId, handlers), [churchId])

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
