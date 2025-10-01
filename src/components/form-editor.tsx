
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Form as FormType } from '@/app/dashboard/forms/page';
import { Trash2 } from 'lucide-react';
import { Input } from './ui/input';

interface FormEditorProps {
    form: FormType;
    onFormUpdated: () => void;
    onDeleteForm: () => void;
}

export function FormEditor({ form: initialForm, onFormUpdated, onDeleteForm }: FormEditorProps) {
  const [form, setForm] = useState<FormType>(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

 const handleSaveAll = async () => {
    if (!form) return;
    setIsSaving(true);
    try {
        const formRef = doc(db, 'forms', form.id);
        await updateDoc(formRef, {
            name: form.name,
            description: form.description,
        });
        toast({
            title: 'Form Saved',
            description: 'Your changes have been saved successfully.',
        });
        onFormUpdated();
    } catch (error) {
        console.error("Error saving form: ", error);
        toast({
            title: 'Error',
            description: 'Failed to save form changes. Please try again.',
            variant: 'destructive'
        });
    } finally {
        setIsSaving(false);
    }
  }

  if (!form) {
    return null;
  }

  return (
    <div className="space-y-4">
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-2xl font-semibold font-headline">
                            Edit Form
                        </CardTitle>
                        <CardDescription>
                            Modify the name and description for this form template.
                        </CardDescription>
                    </div>
                    <Button variant="destructive" size="icon" onClick={onDeleteForm}>
                        <Trash2 className="size-4" />
                        <span className="sr-only">Delete Form</span>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="form-label">Form Name</Label>
                    <Input 
                        id="form-label"
                        value={form.name}
                        onChange={(e) => setForm(f => ({...f, name: e.target.value}))}
                        className="text-lg font-medium"
                    />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="form-description">Description</Label>
                    <Textarea
                        id="form-description"
                        value={form.description}
                        onChange={(e) => setForm(f => ({...f, description: e.target.value}))}
                        className="min-h-24"
                    />
                </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Form Fields</CardTitle>
                <CardDescription>Drag and drop fields from the library to build your form.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed">
                    <p className="text-muted-foreground">The form builder will be here.</p>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardFooter className="justify-end gap-2">
                <Button variant="outline" onClick={() => setForm(initialForm)}>Cancel</Button>
                <Button onClick={handleSaveAll} className="bg-accent hover:bg-accent/90" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save All Changes'}
                </Button>
            </CardFooter>
        </Card>
    </div>
  );
}
