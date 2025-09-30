
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
import { Trash2 } from "lucide-react"

interface DataTableRowActionsProps<TData extends User> {
  row: Row<TData>
  onSelectUser: (user: TData) => void;
}

export function DataTableRowActions<TData extends User>({
  row,
  onSelectUser,
}: DataTableRowActionsProps<TData>) {

  const user = row.original

  return null;
}
