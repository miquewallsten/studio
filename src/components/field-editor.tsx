
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import SubFieldsEditor from '@/components/sub-fields-editor';
import { useEffect, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Field as FieldType } from '@/app/dashboard/fields/schema';
import { ScrollArea } from './ui/scroll-area';
import { Trash2 } from 'lucide-react';
import { Input } from './ui/input';

interface FieldEditorProps {
    field: FieldType;
    onFieldUpdated: () => void;
    onDeleteField: () => void;
}

export function FieldEditor({ field: initialField, onFieldUpdated, onDeleteField }: FieldEditorProps) {
  const [field, setField] = useState<FieldType>(initialField);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setField(initialField);
  }, [initialField]);

 const handleSaveAll = async () => {
    if (!field) return;
    setIsSaving(true);
    try {
        const fieldRef = doc(db, 'fields', field.id);
        await updateDoc(fieldRef, {
            label: field.label,
            subFields: field.subFields,
            internalFields: field.internalFields,
            aiInstructions: field.aiInstructions,
        });
        toast({
            title: 'Field Saved',
            description: 'Your changes have been saved successfully.',
        });
        onFieldUpdated();
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


  if (!field) {
    return null;
  }

  return (
    <div className="space-y-4">
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-2xl font-semibold font-headline">
                            Edit Field
                        </CardTitle>
                        <CardDescription>
                            Modify the configuration for this reusable library field.
                        </CardDescription>
                    </div>
                    <Button variant="destructive" size="icon" onClick={onDeleteField}>
                        <Trash2 className="size-4" />
                        <span className="sr-only">Delete Field</span>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid gap-2">
                    <Label htmlFor="field-label">Field Label</Label>
                    <Input 
                        id="field-label"
                        value={field.label}
                        onChange={(e) => setField(f => ({...f, label: e.target.value}))}
                        className="text-lg font-medium"
                    />
                </div>
            </CardContent>
        </Card>
        
        {field.type === 'composite' && (
            <SubFieldsEditor 
                title="Composite Field Builder"
                description="Define the user-facing sub-fields that make up this composite field."
                subFields={field.subFields || []}
                onSubFieldsChange={(newSubFields) => setField(f => ({...f, subFields: newSubFields}))}
            />
        )}

        <SubFieldsEditor 
            title="Internal Analyst Fields"
            description="Define fields that are only visible to internal analysts for notes and validation."
            subFields={field.internalFields || []}
            onSubFieldsChange={(newFields) => setField(f => ({...f, internalFields: newFields}))}
        />

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
                onChange={(e) => setField(f => ({...f, aiInstructions: e.target.value}))}
                className="min-h-24 font-mono text-xs"
            />
            </CardContent>
        </Card>
        
        <Card>
            <CardFooter className="justify-end gap-2">
                <Button variant="outline" onClick={() => setField(initialField)}>Cancel</Button>
                <Button onClick={handleSaveAll} className="bg-accent hover:bg-accent/90" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save All Changes'}
                </Button>
            </CardFooter>
        </Card>
    </div>
  );
}
