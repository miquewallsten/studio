"use client"

import { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import type { Form } from "./page"
import { format } from "date-fns"

export const columns: ColumnDef<Form>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Form Name" />
    ),
    cell: ({ row }) => {
        return (
            <div className="font-medium">{row.original.name}</div>
        )
    },
    enableSorting: true,
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    cell: ({ row }) => {
        return (
            <div className="text-sm text-muted-foreground truncate max-w-xs">{row.original.description}</div>
        )
    },
  },
  {
    accessorKey: "fields",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Fields" />
    ),
    cell: ({ row }) => {
        const fieldCount = row.original.fields?.length || 0;
        return (
            <div className="text-center">{fieldCount}</div>
        )
    },
    },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => {
      const date = row.original.createdAt.toDate()
      const formattedDate = format(date, "PPP")
      return <div>{formattedDate}</div>
    },
  },
]
