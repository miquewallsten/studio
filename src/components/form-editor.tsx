

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { useEffect, useState, useMemo } from 'react';
import { doc, updateDoc, getDocs, collection, where, query, documentId, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Form as FormType } from '@/app/dashboard/forms/page';
import { Trash2 } from 'lucide-react';
import { Input } from './ui/input';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { Badge } from './ui/badge';
import type { Field } from '@/app/dashboard/fields/schema';
import { cn } from '@/lib/utils';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';

interface FormEditorProps {
    form: FormType;
    onFormUpdated: () => void;
    onDeleteForm: () => void;
}

type ExpertiseGroup = {
    id: string;
    name: string;
}

export function FormEditor({ form: initialForm, onFormUpdated, onDeleteForm }: FormEditorProps) {
  const [form, setForm] = useState<FormType>(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [formFields, setFormFields] = useState<Field[]>([]);
  const [expertiseGroups, setExpertiseGroups] = useState<ExpertiseGroup[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  useEffect(() => {
    // Fetch expertise groups
    const q = query(collection(db, 'expertise_groups'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const groups = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
        setExpertiseGroups(groups);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (form.fields && form.fields.length > 0) {
      const fieldsQuery = query(
        collection(db, 'fields'),
        where(documentId(), 'in', form.fields)
      );
      getDocs(fieldsQuery).then((snapshot) => {
        const fieldsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Field));
        
        // Preserve the order from the form's field array
        const orderedFields = form.fields!.map(fieldId => 
            fieldsData.find(field => field.id === fieldId)
        ).filter((f): f is Field => f !== undefined);

        setFormFields(orderedFields);
      });
    } else {
      setFormFields([]);
    }
  }, [form.fields]);


 const handleSaveAll = async () => {
    if (!form) return;
    setIsSaving(true);
    try {
        const formRef = doc(db, 'forms', form.id);
        await updateDoc(formRef, {
            name: form.name,
            description: form.description,
            expertiseGroupId: form.expertiseGroupId,
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
                            Modify the name, description, and settings for this form template.
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
                <div className="grid gap-2">
                    <Label htmlFor="expertise-group">Auto-Assignment Group</Label>
                     <Select
                        name="expertise-group"
                        value={form.expertiseGroupId}
                        onValueChange={(value) => setForm(f => ({...f, expertiseGroupId: value}))}
                        >
                        <SelectTrigger id="expertise-group">
                            <SelectValue placeholder="Select a group to auto-assign to" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {expertiseGroups.map(group => (
                                <SelectItem key={group.id} value={group.id}>
                                    {group.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">When a ticket uses this form, it will be automatically assigned to an analyst from this group.</p>
                </div>
            </CardContent>
        </Card>
        
        <Droppable droppableId="form-fields-drop-zone">
            {(provided, snapshot) => (
                <Card 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                >
                    <CardHeader>
                        <CardTitle>Form Fields</CardTitle>
                        <CardDescription>Drag and drop fields from the library to build your form.</CardDescription>
                    </CardHeader>
                    <CardContent className={cn("min-h-80 rounded-md border-2 border-dashed transition-colors", snapshot.isDraggingOver ? "border-primary bg-muted" : "")}>
                         {formFields.length === 0 ? (
                            <div className="flex h-full items-center justify-center">
                                <p className="text-muted-foreground p-10 text-center">Drop fields from the library here</p>
                            </div>
                         ) : (
                            <div className="space-y-2 pt-4">
                                {formFields.map((field, index) => (
                                     <Draggable key={field.id} draggableId={field.id} index={index}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                            >
                                                <div className="w-full text-left p-3 rounded-lg border bg-card flex justify-between items-center transition-shadow hover:shadow-md">
                                                    <span className="font-medium">{field.label}</span>
                                                    <Badge variant="outline">{field.type}</Badge>
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                            </div>
                         )}
                         {provided.placeholder}
                    </CardContent>
                </Card>
            )}
        </Droppable>


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
