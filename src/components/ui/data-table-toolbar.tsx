
"use client"

import * as React from "react"
import { Cross2Icon } from "@radix-ui/react-icons"
import { Table } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "@/components/ui/data-table-view-options"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"


interface DataTableToolbarProps<TData> {
  table: Table<TData>
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  const roles = [
      {value: "Super Admin", label: "Super Admin"},
      {value: "Admin", label: "Admin"},
      {value: "Manager", label: "Manager"},
      {value: "Analyst", label: "Analyst"},
      {value: "View Only", label: "View Only"},
      {value: "Tenant Admin", label: "Tenant Admin"},
      {value: "Tenant User", label: "Tenant User"},
      {value: "End User", label: "End User"},
      {value: "Unassigned", label: "Unassigned"},
  ];

  const tenantNames = React.useMemo(() => {
    const names = new Set<string>();
    table.getCoreRowModel().rows.forEach(row => {
        const tenantName = (row.original as any).tenantName;
        if (tenantName) names.add(tenantName);
    });
    return Array.from(names).map(name => ({ value: name, label: name }));
  }, [table.getCoreRowModel().rows]);


  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter by name or email..."
          value={(table.getColumn("displayName")?.getFilterValue() as string) ?? ""}
          onChange={(event) => {
            // This is a bit of a hack to filter multiple columns with one input
            // A more robust solution would use a global filter
            table.getColumn("displayName")?.setFilterValue(event.target.value)
            table.getColumn("email")?.setFilterValue(event.target.value)
          }}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("role") && (
          <DataTableFacetedFilter
            column={table.getColumn("role")}
            title="Role"
            options={roles}
          />
        )}
        {table.getColumn("tenantName") && (
            <DataTableFacetedFilter
                column={table.getColumn("tenantName")}
                title="Tenant"
                options={tenantNames}
            />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  )
}
