'use client';

import { doc, getDoc, updateDoc } from 'firebase/firestore';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

type SubField = {
  id: string;
  label: string;
  type: string;
  required: boolean;
};

type Field = {
  id: string;
  label: string;
  type: string;
  required: boolean;
  subFields: SubField[];
  aiInstructions?: string;
  internalFields?: SubField[];
};


export default function FieldDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [field, setField] = useState<Field | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

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
          aiInstructions: data.aiInstructions || '',
          internalFields: data.internalFields || [],
        });
      }
      setLoading(false);
    };

    getFieldData();
  }, [id]);

 const handleSaveAll = async () => {
    if (!field) return;
    setIsSaving(true);
    try {
        const fieldRef = doc(db, 'fields', field.id);
        // We only save the fields that can be edited on this page
        await updateDoc(fieldRef, {
            subFields: field.subFields,
            aiInstructions: field.aiInstructions,
            internalFields: field.internalFields,
        });
        toast({
            title: 'Field Saved',
            description: 'Your changes have been saved successfully.',
        });
    } catch (error) {
        console.error("Error saving field: ", error);
        toast({
            title: 'Error',
            description: 'Failed to save field changes. Please try again.',
            variant: 'destructive'
        });
    } finally {
        setIsSaving(false);
    }
  }


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
         <Button onClick={handleSaveAll} className="bg-accent hover:bg-accent/90" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Field Configuration</CardTitle>
          <CardDescription>
            Basic details for the "{field.label}" field.
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
        <SubFieldsEditor 
            title="Composite Field Builder"
            description="Define the user-facing sub-fields that make up this composite field."
            subFields={field.subFields}
            onSubFieldsChange={(newSubFields) => setField(f => f ? {...f, subFields: newSubFields} : null)}
        />
      )}

      {field.type === 'text-with-file' && (
         <Card>
            <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>This is how the text with file upload field will appear in a form.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="p-4 border rounded-md bg-muted/50 space-y-4">
                    <div>
                        <Label>{field.label}</Label>
                        <Input disabled placeholder="User text input..." />
                    </div>
                     <div>
                        <Label>Proof Document</Label>
                        <Input disabled type="file" />
                    </div>
                </div>
            </CardContent>
         </Card>
      )}

        <Card>
            <CardHeader>
            <CardTitle>AI Automation</CardTitle>
            <CardDescription>
                Provide instructions for AI tools to automate validation for this field.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <Label htmlFor="ai-instructions">AI Instructions / Script</Label>
            <Textarea
                id="ai-instructions"
                placeholder="e.g., Scrape https://gov-site.com/validate?curp={{value}} and check for a 'valid' status."
                value={field.aiInstructions}
                onChange={(e) => setField(f => f ? {...f, aiInstructions: e.target.value} : null)}
                className="min-h-24 font-mono text-xs"
            />
            </CardContent>
        </Card>

        <SubFieldsEditor 
            title="Internal Analyst Fields"
            description="Define fields that are only visible to internal analysts for notes and validation."
            subFields={field.internalFields || []}
            onSubFieldsChange={(newFields) => setField(f => f ? {...f, internalFields: newFields} : null)}
        />
    </div>
  );
}
