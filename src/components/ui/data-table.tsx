
"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Row,
  FilterFn,
} from "@tanstack/react-table"
import { rankItem } from '@tanstack/match-sorter-utils'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { DataTableToolbar } from "@/components/ui/data-table-toolbar"
import { useSecureFetch } from "@/hooks/use-secure-fetch"
import { useAuthRole } from "@/hooks/use-auth-role"
import { debounce } from "lodash"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[],
  onRowClick?: (row: Row<TData>) => void
  tableId: string;
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value)

  // Store the itemRank info
  addMeta({
    itemRank,
  })

  // Return if the item should be filtered in/out
  return itemRank.passed
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
  tableId,
}: DataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const { user } = useAuthRole();
  const secureFetch = useSecureFetch();
  const hasLoadedPrefs = React.useRef(false);

  // Debounced save function
  const savePreferences = React.useCallback(debounce(async (prefs: { columnVisibility?: VisibilityState, sorting?: SortingState }) => {
    if (!hasLoadedPrefs.current || !user) return;
    try {
      await secureFetch('/api/user/preferences', {
        method: 'POST',
        body: JSON.stringify({
          [tableId]: prefs
        }),
      });
    } catch (e) {
      console.error('Failed to save table preferences', e);
    }
  }, 1000), [secureFetch, user, tableId]);

  // Load state from Firestore on initial render
  React.useEffect(() => {
    let isMounted = true;
    if (user) {
      const fetchPrefs = async () => {
        try {
          const res = await secureFetch('/api/user/preferences');
          const data = await res.json();
          if (isMounted && data[tableId]) {
            if (data[tableId].columnVisibility) setColumnVisibility(data[tableId].columnVisibility);
            if (data[tableId].sorting) setSorting(data[tableId].sorting);
          }
        } catch (e) {
          console.log(`No saved preferences found for table ${tableId}, using defaults.`);
        } finally {
            if(isMounted) hasLoadedPrefs.current = true;
        }
      };
      fetchPrefs();
    }
     return () => { isMounted = false; };
  }, [user, tableId, secureFetch]);

  // Save state to Firestore whenever it changes
  React.useEffect(() => {
    if (hasLoadedPrefs.current) {
        savePreferences({ columnVisibility, sorting });
    }
  }, [columnVisibility, sorting, savePreferences]);


  const table = useReactTable({
    data,
    columns,
    filterFns: {
        fuzzy: fuzzyFilter,
    },
    state: {
      sorting,
      columnVisibility,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    globalFilterFn: 'includesString',
  })

  return (
    <div className="space-y-4 h-full flex flex-col">
      <DataTableToolbar table={table} />
      <div className="rounded-md border relative flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => onRowClick?.(row)}
                  className={onRowClick ? "cursor-pointer" : ""}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2 px-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}
