"use client"

import Link from "next/link"
import { type ColumnDef } from "@tanstack/react-table"

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { zones } from "@church/db"

export function getColumns(churchId: string): ColumnDef<typeof zones.$inferSelect>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Zone Name" />
      ),
      cell: ({ row }) => (
        <Link 
          href={`/${churchId}/dashboard/zones/${row.original.id}`}
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
      accessorKey: "leaderId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Leader" />
      ),
      cell: ({ row }) => <div>{row.original.leaderId || "-"}</div>,
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
        const date = new Date(row.original.createdAt)
        return <div>{date.toLocaleDateString()}</div>
      },
      enableSorting: true,
    },
  ]
}
