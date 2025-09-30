
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

type Form = {
  id: string;
  name: string;
  description: string;
};

// This page will be the form builder UI.
// For now, it shows the form details and a placeholder for adding fields from the library.

async function getFormData(id: string): Promise<Form | null> {
    const docSnap = await getDoc(doc(db, 'forms', id));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name,
          description: data.description,
        };
      }
    return null;
}

export default async function FormDetailPage({ params }: { params: { id: string } }) {
  const form = await getFormData(params.id);

  if (!form) {
    return <div>Form not found.</div>;
  }

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-2">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold font-headline">Edit Form: {form.name}</h1>
         <Button className="bg-accent hover:bg-accent/90">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Field from Library
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
          <div className="h-40 flex items-center justify-center border-dashed border-2 rounded-md">
            <p className="text-muted-foreground">The form builder to add and reorder fields will be here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
