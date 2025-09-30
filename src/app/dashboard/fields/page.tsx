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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './columns';
import type { Field } from './schema';
import { useRouter } from 'next/navigation';


export default function FieldsPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [fieldToDelete, setFieldToDelete] = useState<Field | null>(null);
  const { toast } = useToast();
  const router = useRouter();

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

  const memoizedColumns = useMemo(() => columns({
    onDeleteField: (field) => setFieldToDelete(field),
  }), []);

  return (
    <div className="flex flex-col gap-4">
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

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Field Library</h1>
        <Button asChild className="bg-accent hover:bg-accent/90">
          <Link href="/dashboard/fields/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Field
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Reusable Fields</CardTitle>
          <CardDescription>
            Manage the reusable fields that can be added to any form template.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {loading ? (
                <p>Loading fields...</p>
            ) : (
                <DataTable 
                    columns={memoizedColumns}
                    data={fields}
                    onRowClick={(row) => router.push(`/dashboard/fields/${row.original.id}`)}
                />
            )}
        </CardContent>
      </Card>
    </div>
  );
}
