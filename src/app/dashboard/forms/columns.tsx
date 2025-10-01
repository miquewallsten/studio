
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import type { Form } from "./schema"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export const columns: ColumnDef<Form>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Form Name" />
    ),
    cell: ({ row }) => {
        return (
            <span className="font-medium">{row.original.name}</span>
        )
    },
    enableHiding: false,
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    cell: ({ row }) => {
        return (
            <span className="text-muted-foreground truncate">{row.original.description}</span>
        )
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"))
      const formattedDate = date.toLocaleDateString()
      return <div>{formattedDate}</div>
    },
  },
    {
    id: "actions",
    cell: ({ row }) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => e.stopPropagation()}
            aria-label="View form details"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  },
]
