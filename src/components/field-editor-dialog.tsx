'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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

interface FieldEditorDialogProps {
    field: FieldType | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function FieldEditorDialog({ field: initialField, isOpen, onOpenChange }: FieldEditorDialogProps) {
  const [field, setField] = useState<FieldType | null>(initialField);
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
        onOpenChange(false); // Close dialog on save
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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle className="text-2xl font-semibold font-headline">
                    Edit Field: {field.label}
                </DialogTitle>
                <DialogDescription>
                    Modify the configuration for this reusable library field.
                </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 pr-6">
                 <div className="space-y-4 py-4">
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
                            subFields={field.subFields || []}
                            onSubFieldsChange={(newSubFields) => setField(f => f ? {...f, subFields: newSubFields} : null)}
                        />
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
            </ScrollArea>
            <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={handleSaveAll} className="bg-accent hover:bg-accent/90" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save All Changes'}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}
