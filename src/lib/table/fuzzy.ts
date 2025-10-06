import { rankItem } from '@tanstack/match-sorter-utils';

// Column-level fuzzy filter
export const fuzzyFilter = (row: any, columnId: string, value: string) =>
  rankItem(row.getValue(columnId), value).passed;

// Global fuzzy filter (basic: concatenates row.original)
export const fuzzyGlobalFilter = (row: any, _columnIds: string[], value: string) =>
  rankItem(String(Object.values(row.original ?? {}).join(' ')), value).passed;
