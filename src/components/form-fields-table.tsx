'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
  
export type Field = {
    id: string;
    label: string;
    type: 'text' | 'email' | 'file' | 'textarea' | 'date';
    required: boolean;
    order: number;
};
  
interface FormFieldsTableProps {
    fields: Field[];
}
  
export function FormFieldsTable({ fields }: FormFieldsTableProps) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Label</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Required</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No fields have been added to this form yet.
              </TableCell>
            </TableRow>
          ) : (
            fields.map((field) => (
              <TableRow key={field.id}>
                <TableCell>{field.order}</TableCell>
                <TableCell className="font-medium">{field.label}</TableCell>
                <TableCell>
                  <Badge variant="outline">{field.type}</Badge>
                </TableCell>
                <TableCell>{field.required ? 'Yes' : 'No'}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    );
}
  
