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
import { members } from "@church/db"
import type { Translate } from "@church/config"

export function getColumns(churchId: string, t: Translate): ColumnDef<typeof members.$inferSelect>[] {
  return [
    {
      accessorKey: "firstName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("component.memberTable.firstName")} />
      ),
      cell: ({ row }) => <div>{row.original.firstName}</div>,
      enableSorting: true,
    },
    {
      accessorKey: "lastName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("component.memberTable.lastName")} />
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
      accessorKey: "dateOfBirth",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("component.memberTable.dateOfBirth")} />
      ),
      cell: ({ row }) => <div>{row.original.dateOfBirth}</div>,
      enableSorting: true,
    },
    {
      accessorKey: "phone",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("component.memberTable.phone")} />
      ),
      cell: ({ row }) => <div>{row.original.phone || "-"}</div>,
      enableSorting: true,
    },
    {
      accessorKey: "gender",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("component.memberTable.gender")} />
      ),
      cell: ({ row }) => <div className="capitalize">{row.original.gender}</div>,
      enableSorting: true,
    },
    {
      accessorKey: "maritalStatus",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("component.memberTable.maritalStatus")} />
      ),
      cell: ({ row }) => <div className="capitalize">{row.original.maritalStatus}</div>,
      enableSorting: true,
    },
    {
      id: "actions",
      header: t("component.memberTable.actions"),
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">{t("component.memberTable.openMenu")}</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/${churchId}/dashboard/members/${row.original.id}`} className="flex items-center gap-2 cursor-pointer">
                <Eye className="h-4 w-4" />
                {t("component.memberTable.view")}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}
