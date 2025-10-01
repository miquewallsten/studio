
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import type { Tenant } from "./schema"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

type ColumnsProps = {
  onSelectTenant: (tenant: Tenant) => void;
  t: (key: string) => string;
}

export const columns = ({ onSelectTenant, t }: ColumnsProps): ColumnDef<Tenant>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('common.tenant_name')} />
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
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('common.status')} />
    ),
    cell: ({ row }) => {
        const status = row.original.status;
        return (
            <Badge variant={status === 'INVITED' ? 'destructive' : 'default'}>{status || 'ACTIVE'}</Badge>
        )
    },
    enableSorting: true,
  },
    {
    accessorKey: "url",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('tenants.columns.portal_url')} />
    ),
    cell: ({ row }) => {
        const url = row.original.url;
        if (!url) return <span className="text-muted-foreground">Not set</span>;
        return (
            <a 
              href={url.startsWith('http') ? url : `https://${url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-500 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
                {url}
                <ExternalLink className="size-3" />
            </a>
        )
    },
    enableSorting: false,
  },
  {
    accessorKey: "userCount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('tenants.columns.users')} />
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
      <DataTableColumnHeader column={column} title={t('tenants.columns.tickets')} />
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
      <DataTableColumnHeader column={column} title={t('common.created')} />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"))
      const formattedDate = date.toLocaleDateString()
      return <div>{formattedDate}</div>
    },
  },
]
