"use client"

import Link from "next/link"
import { type ColumnDef } from "@tanstack/react-table"
import { Eye, UserCheck, Trash2 } from "lucide-react"

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import type { Visitor } from "@church/db"

type VisitorWithActions = Visitor & {
  onConvert?: (visitorId: string) => Promise<void>
  onDelete?: (visitorId: string) => Promise<void>
}

export function getVisitorColumns(
  churchId: string,
  handlers?: {
    onConvert?: (visitorId: string) => Promise<void>
    onDelete?: (visitorId: string) => Promise<void>
  }
): ColumnDef<Visitor>[] {
  return [
    {
      accessorKey: "firstName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="First Name" />
      ),
      cell: ({ row }) => <div>{row.original.firstName}</div>,
      enableSorting: true,
    },
    {
      accessorKey: "lastName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Last Name" />
      ),
      cell: ({ row }) => (
        <Link 
          href={`/${churchId}/dashboard/visitors/${row.original.id}`}
          className="text-blue-600 hover:underline font-semibold"
        >
          {row.original.lastName}
        </Link>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "phone",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Phone" />
      ),
      cell: ({ row }) => <div>{row.original.phone || "-"}</div>,
      enableSorting: true,
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      cell: ({ row }) => <div className="text-sm">{row.original.email || "-"}</div>,
      enableSorting: true,
    },
    {
      accessorKey: "visitDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Visit Date" />
      ),
      cell: ({ row }) => (
        <div>
          {row.original.visitDate 
            ? new Date(row.original.visitDate).toLocaleDateString()
            : "-"
          }
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "visitorSource",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Source" />
      ),
      cell: ({ row }) => (
        <div className="capitalize text-sm">
          {row.original.visitorSource?.replace('_', ' ') || "-"}
        </div>
      ),
      enableSorting: true,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex flex-col gap-2">
          <Link 
            href={`/${churchId}/dashboard/visitors/${row.original.id}`}
            className="flex items-center gap-2 text-blue-600 hover:underline text-sm"
          >
            <Eye className="h-4 w-4" />
            View Details
          </Link>

          {handlers?.onConvert && (
            <button
              onClick={() => handlers.onConvert?.(row.original.id)}
              className="flex items-center gap-2 text-green-600 hover:underline text-sm cursor-pointer"
            >
              <UserCheck className="h-4 w-4" />
              Convert to Member
            </button>
          )}

          {handlers?.onDelete && (
            <button
              onClick={() => handlers.onDelete?.(row.original.id)}
              className="flex items-center gap-2 text-red-600 hover:underline text-sm cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
        </div>
      ),
    },
  ]
}
