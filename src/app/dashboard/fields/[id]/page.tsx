
'use client';

import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import SubFieldsEditor from '@/components/sub-fields-editor';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

type Field = {
  id: string;
  label: string;
  type: string;
  required: boolean;
  subFields?: any[]; // Basic type for now
};


export default function FieldDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [field, setField] = useState<Field | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const getFieldData = async () => {
      const docSnap = await getDoc(doc(db, 'fields', id));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setField({
          id: docSnap.id,
          label: data.label,
          type: data.type,
          required: data.required,
          subFields: data.subFields || [],
        });
      }
      setLoading(false);
    };

    getFieldData();
  }, [id]);


  if (loading) {
    return (
        <div className="mx-auto grid w-full max-w-4xl gap-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-1/2" />
            </div>
             <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        <Skeleton className="h-6 w-1/4" />
                        <Skeleton className="h-6 w-1/4" />
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-40 w-full" />
                </CardContent>
            </Card>
        </div>
    )
  }

  if (!field) {
    return <div>Field not found.</div>;
  }

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold font-headline">
          Edit Field: {field.label}
        </h1>
        {/* Save button will go here */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Field Configuration</CardTitle>
          <CardDescription>
            Editing details for the "{field.label}" field.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <strong>Type:</strong> {field.type}
            </div>
            <div>
              <strong>Required:</strong> {field.required ? 'Yes' : 'No'}
            </div>
          </div>
        </CardContent>
      </Card>

      {field.type === 'composite' && (
        <SubFieldsEditor fieldId={field.id} initialSubFields={field.subFields || []} />
      )}

      {field.type === 'text-with-file' && (
         <Card>
            <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>This is how the text with file upload field will appear in a form.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="p-4 border rounded-md bg-muted/50">
                    <p className="text-sm text-muted-foreground">A text input will appear here, followed by a file upload button.</p>
                </div>
            </CardContent>
         </Card>
      )}

    </div>
  );
}
