
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

type Field = {
  id: string;
  label: string;
  type: string;
  required: boolean;
  subFields?: any[]; // Basic type for now
};

async function getFieldData(id: string): Promise<Field | null> {
  const docSnap = await getDoc(doc(db, 'fields', id));
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      label: data.label,
      type: data.type,
      required: data.required,
      subFields: data.subFields || [],
    };
  }
  return null;
}

export default async function FieldDetailPage({ params }: { params: { id: string } }) {
  const field = await getFieldData(params.id);

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
