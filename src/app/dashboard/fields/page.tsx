'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PlusCircle, ArrowRight, Search, MoreHorizontal, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

type Field = {
  id: string;
  label: string;
  type: string;
  required: boolean;
};

export default function FieldsPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [fieldToDelete, setFieldToDelete] = useState<Field | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, 'fields'), orderBy('label'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fieldsData: Field[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fieldsData.push({
          id: doc.id,
          label: data.label,
          type: data.type,
          required: data.required,
        });
      });
      setFields(fieldsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredFields = useMemo(() => {
    return fields.filter((field) =>
      field.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [fields, searchQuery]);

  const handleDelete = async () => {
    if (fieldToDelete) {
      try {
        await deleteDoc(doc(db, 'fields', fieldToDelete.id));
        toast({
          title: 'Field Deleted',
          description: `The field "${fieldToDelete.label}" has been deleted.`,
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete the field. It might be in use.',
          variant: 'destructive',
        });
        console.error('Error deleting field:', error);
      } finally {
        setFieldToDelete(null);
      }
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Field Library</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by label..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button asChild className="bg-accent hover:bg-accent/90">
            <Link href="/dashboard/fields/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Field
            </Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Reusable Fields</CardTitle>
          <CardDescription>
            Manage the reusable fields that can be added to any form template.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Loading fields...
                  </TableCell>
                </TableRow>
              ) : filteredFields.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No fields found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredFields.map((field) => (
                  <TableRow key={field.id}>
                    <TableCell className="font-medium">{field.label}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{field.type}</Badge>
                    </TableCell>
                    <TableCell>{field.required ? 'Yes' : 'No'}</TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                             <Link href={`/dashboard/fields/${field.id}`}>
                                <ArrowRight className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setFieldToDelete(field)} className="text-destructive">
                             <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <AlertDialog open={fieldToDelete !== null} onOpenChange={(open) => !open && setFieldToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              field <span className="font-bold">"{fieldToDelete?.label}"</span>. If this field is used in any forms, it may cause unexpected behavior.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Yes, delete field
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
