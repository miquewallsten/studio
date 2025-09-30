
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
    // Safely check if tenantName column exists before processing
    const tenantNameColumn = table.getAllColumns().find(c => c.id === 'tenantName');
    if (!tenantNameColumn) {
        return [];
    }
    const names = new Set<string>();
    table.getPreFilteredRowModel().rows.forEach(row => {
        const tenantName = (row.original as any).tenantName;
        if (tenantName) names.add(tenantName);
    });
    return Array.from(names).map(name => ({ value: name, label: name }));
  }, [table]);


  // Find a generic column to filter by text, like 'name' or 'email' or 'subject'
  const filterColumn = table.getAllColumns().find(c => {
    const id = c.id.toLowerCase();
    return id.includes('name') || id.includes('email') || id.includes('subject');
  });

  const roleColumn = table.getColumn("role");
  const tenantNameColumn = table.getColumn("tenantName");

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {filterColumn && (
            <Input
            placeholder={`Filter by ${filterColumn.id}...`}
            value={(table.getColumn(filterColumn.id)?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
                table.getColumn(filterColumn.id)?.setFilterValue(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px]"
            />
        )}
        {roleColumn && (
          <DataTableFacetedFilter
            column={roleColumn}
            title="Role"
            options={roles}
          />
        )}
        {tenantNameColumn && tenantNames.length > 0 && (
            <DataTableFacetedFilter
                column={tenantNameColumn}
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
