
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"
import type { User } from "./schema"
import { InlineTagEditor } from "@/components/inline-tag-editor"

type ColumnsProps = {
  onSelectUser: (user: User) => void;
  allTags: string[];
  onUserUpdated: () => void;
}

export const columns = ({ onSelectUser, allTags, onUserUpdated }: ColumnsProps): ColumnDef<User>[] => [
  {
    accessorKey: "displayName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="User" />
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
      <DataTableColumnHeader column={column} title="Email" />
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
      <DataTableColumnHeader column={column} title="Role" />
    ),
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      return (
        <div className="flex space-x-2">
          <Badge variant={role === 'Unassigned' ? 'destructive' : 'secondary'}>{role}</Badge>
        </div>
      )
    },
    filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
    }
  },
  {
    accessorKey: "tags",
    header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tags" />
    ),
    cell: ({ row }) => {
        const user = row.original;
        return (
            <InlineTagEditor 
                user={user} 
                allTags={allTags}
                onUserUpdated={onUserUpdated}
            />
        )
    },
    enableSorting: false,
  },
  {
    accessorKey: "tenantName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tenant" />
    ),
    cell: ({ row }) => {
      const tenantName = row.getValue("tenantName") as string | null;
      return (
        <div className="flex items-center">
          <span>{tenantName || "N/A"}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
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
    cell: ({ row }) => <DataTableRowActions row={row} onSelectUser={onSelectUser} />,
  },
]
