"use client"

import * as React from "react"
import { members } from "@/db/schema"
import { type ColumnDef } from "@tanstack/react-table"

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"

export function getColumns(): ColumnDef<typeof members.$inferSelect>[] {
  return [
    {
      accessorKey: "id",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="ID" />
      ),
      cell: ({ row }) => (
        <div>{row.original.id.toString().substring(0, 5)}</div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "fullName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Full Name" />
      ),
      cell: ({ row }) => <div>{row.original.fullName}</div>,
      enableSorting: true,
    },
    {
      accessorKey: "birthDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Birth Date" />
      ),
      cell: ({ row }) => <div>{row.original.birthDate}</div>,
      enableSorting: true,
    },
    {
      accessorKey: "gender",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Gender" />
      ),
      cell: ({ row }) => <div>{row.original.gender}</div>,
      enableSorting: true,
    },
    {
      accessorKey: "maritalStatus",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Marital Status" />
      ),
      cell: ({ row }) => <div>{row.original.maritalStatus}</div>,
      enableSorting: true,
    },
  ]
}

// function handleDelete(user: User) {
//   // Implement delete functionality here
//   console.log("Delete", user)
// }
