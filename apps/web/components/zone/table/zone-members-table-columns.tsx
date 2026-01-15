"use client"

import Link from "next/link"
import { type ColumnDef } from "@tanstack/react-table"
import { Eye, MoreHorizontal, UserMinus, Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { members } from "@church/db"

type Handlers = {
  onAssignLeader?: (memberId: string) => Promise<void>
  onUnassign?: (memberId: string) => Promise<void>
}

export function getZoneMembersColumns(
  churchId: string,
  handlers?: Handlers
): ColumnDef<typeof members.$inferSelect>[] {
  return [
    {
      accessorKey: "firstName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="First Name" />
      ),
      cell: ({ row }) => {
        const isLeader = (row.original as any).isLeader
        return (
          <div className="flex items-center gap-2">
            <div>{row.original.firstName}</div>
            {isLeader && (
              <div className="inline-flex items-center rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                <Star className="mr-1 h-3 w-3" /> Leader
              </div>
            )}
          </div>
        )
      },
      enableSorting: true,
    },
    {
      accessorKey: "lastName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Last Name" />
      ),
      cell: ({ row }) => (
        <Link 
          href={`/${churchId}/dashboard/members/${row.original.id}`}
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
      accessorKey: "gender",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Gender" />
      ),
      cell: ({ row }) => <div className="capitalize">{row.original.gender}</div>,
      enableSorting: true,
    },
    {
      accessorKey: "occupation",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Occupation" />
      ),
      cell: ({ row }) => <div>{row.original.occupation || "-"}</div>,
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
              <Link href={`/${churchId}/dashboard/members/${row.original.id}`} className="flex items-center gap-2 cursor-pointer">
                <Eye className="h-4 w-4" />
                View
              </Link>
            </DropdownMenuItem>

            {handlers?.onAssignLeader && !(row.original as any).isLeader && (
              <DropdownMenuItem
                onClick={() => handlers.onAssignLeader!(row.original.id)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Star className="h-4 w-4" />
                Set as Leader
              </DropdownMenuItem>
            )}

            {handlers?.onUnassign && (
              <DropdownMenuItem
                onClick={() => handlers.onUnassign!(row.original.id)}
                className="flex items-center gap-2 cursor-pointer text-destructive"
              >
                <UserMinus className="h-4 w-4" />
                Remove from Zone
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}
