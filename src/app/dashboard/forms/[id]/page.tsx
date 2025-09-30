'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { FormFieldsTable, Field } from '@/components/form-fields-table';
import { Skeleton } from '@/components/ui/skeleton';

type Form = {
  id: string;
  name: string;
  description: string;
};

export default function FormDetailPage({ params }: { params: { id: string } }) {
  const [form, setForm] = useState<Form | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const formRef = doc(db, 'forms', params.id);

    const getFormData = async () => {
      const docSnap = await getDoc(formRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setForm({
          id: docSnap.id,
          name: data.name,
          description: data.description,
        });
      }
      // We will set loading to false in the snapshot listener
    };

    getFormData();

    const fieldsQuery = query(collection(db, 'forms', params.id, 'fields'), orderBy('order'));
    const unsubscribe = onSnapshot(fieldsQuery, (querySnapshot) => {
        const fieldsData: Field[] = [];
        querySnapshot.forEach((doc) => {
            fieldsData.push({ id: doc.id, ...doc.data() } as Field);
        });
        setFields(fieldsData);
        setLoading(false);
    });

    return () => unsubscribe();

  }, [params.id]);

  if (loading) {
    return (
      <div className="mx-auto grid w-full max-w-4xl gap-4">
        <Skeleton className="h-8 w-1/2" />
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-40 w-full" />
            </CardContent>
        </Card>
      </div>
    );
  }

  if (!form) {
    return <div>Form not found.</div>;
  }

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-2">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold font-headline">Edit Form: {form.name}</h1>
         <Button className="bg-accent hover:bg-accent/90">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Field
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Form Fields</CardTitle>
          <CardDescription>
            These are the fields that will be presented to the end-user when they fill out the {form.name} form.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormFieldsTable fields={fields} />
        </CardContent>
      </Card>
    </div>
  );
}
