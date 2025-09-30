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
import { FieldEditor } from '@/components/field-editor';


export default function FieldsPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [fieldToDelete, setFieldToDelete] = useState<Field | null>(null);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
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
          subFields: data.subFields || [],
          aiInstructions: data.aiInstructions || '',
          internalFields: data.internalFields || [],
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
        if (selectedField?.id === fieldToDelete.id) {
          setSelectedField(null);
        }
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
  
  const handleSelectField = (field: Field) => {
    setSelectedField(field);
  };
  
  const handleFieldUpdate = () => {
    // Optionally re-fetch or update the list if needed,
    // though onSnapshot should handle it.
    // For now, we can just clear the selection or keep it.
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Card>
            <CardHeader>
            <CardTitle>Reusable Fields</CardTitle>
            <CardDescription>
                Manage the reusable fields that can be added to any form template. Click a row to edit.
            </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <p>Loading fields...</p>
                ) : (
                    <DataTable 
                        columns={memoizedColumns}
                        data={fields}
                        onRowClick={(row) => handleSelectField(row.original)}
                    />
                )}
            </CardContent>
        </Card>
        
        <div className="sticky top-4">
           {selectedField ? (
                <FieldEditor 
                    key={selectedField.id} // Add key to force re-mount on selection change
                    field={selectedField}
                    onFieldUpdated={handleFieldUpdate}
                />
           ) : (
                <Card className="h-96 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                        <p>Select a field to view and edit its details.</p>
                    </div>
                </Card>
           )}
        </div>

      </div>
    </div>
  );
}
