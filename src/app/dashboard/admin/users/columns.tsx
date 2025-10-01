
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import type { User } from "./schema"
import { InlineTagEditor } from "@/components/inline-tag-editor"

type ColumnsProps = {
  onSelectUser: (user: User) => void;
  allTags: string[];
  onUserUpdated: () => void;
  t: (key: string) => string;
}

const getRoleVariant = (role: string) => {
    switch (role) {
        case 'Super Admin': return 'default';
        case 'Admin': return 'default';
        case 'Unassigned': return 'destructive';
        case 'Tenant Admin': return 'outline';
        default: return 'secondary';
    }
}


export const columns = ({ onSelectUser, allTags, onUserUpdated, t }: ColumnsProps): ColumnDef<User>[] => [
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
    accessorKey: "tags",
    header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('users.columns.tags')} />
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
      <DataTableColumnHeader column={column} title={t('users.columns.tenant')} />
    ),
    cell: ({ row }) => {
      const tenantName = row.getValue("tenantName") as string | null;
      return (
        <div className="flex items-center">
          <span>{tenantName || "Internal Staff"}</span>
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
      <DataTableColumnHeader column={column} title={t('common.created')} />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"))
      const formattedDate = date.toLocaleDateString()
      return <div>{formattedDate}</div>
    },
  },
]
