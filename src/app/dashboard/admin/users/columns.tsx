
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"
import type { User } from "./schema"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type ColumnsProps = {
  onSelectUser: (user: User) => void;
}

export const columns = ({ onSelectUser }: ColumnsProps): ColumnDef<User>[] => [
  {
    accessorKey: "displayName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="User" />
    ),
    cell: ({ row }) => {
        const user = row.original;
        return (
            <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL ?? undefined} />
                    <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <span className="font-medium">{user.displayName || 'No Name'}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
            </div>
        )
    },
    enableSorting: true,
    enableHiding: false,
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
        const tags = row.getValue("tags") as string[] | undefined;
        if (!tags || tags.length === 0) {
            return null;
        }
        return (
            <div className="flex flex-wrap gap-1">
                {tags.map((tag, i) => (
                    <Badge key={i} variant="outline">{tag}</Badge>
                ))}
            </div>
        )
    }
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
