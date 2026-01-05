"use client"

import Link from "next/link"
import { type ColumnDef } from "@tanstack/react-table"

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { members } from "@church/db"

export function getColumns(churchId: string): ColumnDef<typeof members.$inferSelect>[] {
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
        <DataTableColumnHeader column={column} title="Date of Birth" />
      ),
      cell: ({ row }) => <div>{row.original.dateOfBirth}</div>,
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
      accessorKey: "maritalStatus",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Marital Status" />
      ),
      cell: ({ row }) => <div className="capitalize">{row.original.maritalStatus}</div>,
      enableSorting: true,
    },
  ]
}

// function handleDelete(user: User) {
//   // Implement delete functionality here
//   console.log("Delete", user)
// }
