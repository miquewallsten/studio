"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import type { User } from "./schema"

type ColumnsProps = {
  t: (key: string) => string;
}

const getRoleVariant = (role: string) => {
    switch (role) {
        case 'Tenant Admin': return 'default';
        default: return 'secondary';
    }
}


export const columns = ({ t }: ColumnsProps): ColumnDef<User>[] => [
  {
    accessorKey: "displayName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('users.columns.user')} />
    ),
    cell: ({ row }) => {
        const user = row.original;
        return (
            <span className="font-medium">{user.displayName || 'No Name'}</span>
        )
    },
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('users.columns.email')} />
    ),
    cell: ({ row }) => {
        return (
            <div className="flex items-center">
                <span>{row.original.email}</span>
            </div>
        )
    },
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('users.columns.role')} />
    ),
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      return (
        <div className="flex space-x-2">
          <Badge variant={getRoleVariant(role)}>{role}</Badge>
        </div>
      )
    },
    filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
    }
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('common.created')} />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"))
      const formattedDate = date.toLocaleDateString()
      return <div>{formattedDate}</div>
    },
  },
]
