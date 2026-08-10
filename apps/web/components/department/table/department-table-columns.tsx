"use client"

import Link from "next/link"
import { type ColumnDef } from "@tanstack/react-table"
import { Eye, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { departments } from "@church/db"

export function getDepartmentColumns(churchId: string): ColumnDef<typeof departments.$inferSelect>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Department Name" />
      ),
      cell: ({ row }) => (
        <Link
          href={`/${churchId}/dashboard/departments/${row.original.id}`}
          className="text-blue-600 hover:underline font-semibold"
        >
          {row.original.name}
        </Link>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "description",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Description" />
      ),
      cell: ({ row }) => <div>{row.original.description || "-"}</div>,
      enableSorting: false,
    },
    {
      accessorKey: "meetingDay",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Meeting Day" />
      ),
      cell: ({ row }) => <div className="capitalize">{row.original.meetingDay || "-"}</div>,
      enableSorting: true,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => {
        const createdAt = row.original.createdAt
        if (!createdAt) return <div>-</div>
        const date = new Date(createdAt)
        return <div>{date.toLocaleDateString()}</div>
      },
      enableSorting: true,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/${churchId}/dashboard/departments/${row.original.id}`} className="flex items-center gap-2 cursor-pointer">
                <Eye className="h-4 w-4" />
                View Department
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}
