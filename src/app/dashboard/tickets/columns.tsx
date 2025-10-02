
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import type { Ticket } from "./schema"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

const getStatusVariant = (status: string) => {
    switch (status) {
      case 'New':
        return 'destructive';
      case 'Completed':
        return 'default';
      default:
        return 'secondary';
    }
  };

export const columns: ColumnDef<Ticket>[] = [
  {
    accessorKey: "subjectName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={"Subject"} />
    ),
    cell: ({ row }) => {
        return (
            <div className="font-medium">{row.original.subjectName}</div>
        )
    },
    enableSorting: true,
  },
  {
    accessorKey: "reportType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={"Report Type"} />
    ),
    enableSorting: true,
  },
  {
    accessorKey: "clientEmail",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={"Requester"} />
    ),
    cell: ({ row }) => {
        return (
            <div>{row.original.clientEmail}</div>
        )
    },
    enableSorting: true,
  },
  {
    accessorKey: "assignedAnalystId",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={"Assignee"} />
    ),
    cell: ({ row }) => {
        const assignee = row.original.assignedAnalystId; // In a real app, you'd resolve this to a name
        return (
            <div>{assignee ? assignee.substring(0,5) + '...' : <span className="text-muted-foreground">Unassigned</span>}</div>
        )
    },
    enableSorting: true,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={"Status"} />
    ),
    cell: ({ row }) => {
        const status = row.original.status;
        return (
            <Badge variant={getStatusVariant(status)}>{status}</Badge>
        )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    }
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={"Created"} />
    ),
    cell: ({ row }) => {
      const date = row.original.createdAt.toDate()
      const formattedDate = format(date, "PPP")
      return <div>{formattedDate}</div>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <div className="text-right">
            <Button asChild variant="ghost" size="icon">
                <Link href={`/dashboard/tickets/${row.original.id}`}>
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </Button>
        </div>
      )
    },
  },
]
