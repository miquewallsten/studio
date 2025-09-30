
"use client"

import { DotsHorizontalIcon } from "@radix-ui/react-icons"
import { Row } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import type { User } from "./schema"
import { Edit, Trash2, Eye } from "lucide-react"

interface DataTableRowActionsProps<TData extends User> {
  row: Row<TData>
  onSelectUser: (user: TData) => void;
}

export function DataTableRowActions<TData extends User>({
  row,
  onSelectUser,
}: DataTableRowActionsProps<TData>) {

  const user = row.original

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem onClick={() => onSelectUser(user)}>
            <Eye className="mr-2 h-4 w-4" />
            View Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelectUser(user)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
