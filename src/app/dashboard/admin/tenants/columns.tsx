
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import type { Tenant } from "./schema"

type ColumnsProps = {
  onSelectTenant: (tenant: Tenant) => void;
}

export const columns = ({ onSelectTenant }: ColumnsProps): ColumnDef<Tenant>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tenant Name" />
    ),
    cell: ({ row }) => {
        const tenant = row.original;
        return (
            <span className="font-medium">{tenant.name}</span>
        )
    },
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "userCount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Users" />
    ),
     cell: ({ row }) => {
        return (
            <div className="flex items-center justify-center">
                <span>{row.original.userCount}</span>
            </div>
        )
    },
  },
  {
    accessorKey: "ticketsCreated",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tickets" />
    ),
     cell: ({ row }) => {
        return (
            <div className="flex items-center justify-center">
                <span>{row.original.ticketsCreated}</span>
            </div>
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
]
