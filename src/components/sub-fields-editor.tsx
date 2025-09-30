
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from './ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';

type SubField = {
  id: string;
  label: string;
  type: string;
  required: boolean;
};

interface SubFieldsEditorProps {
  fieldId: string;
  initialSubFields: SubField[];
}

// NOTE: This is a placeholder component. The functionality to save sub-fields
// to the database will be implemented in a future step.

export default function SubFieldsEditor({
  fieldId,
  initialSubFields,
}: SubFieldsEditorProps) {
  const [subFields, setSubFields] = useState<SubField[]>(initialSubFields);

  const handleAddSubField = () => {
    // In a real implementation, we would show a dialog or inline form
    // to define the new sub-field. For now, we'll add a placeholder.
    const newSubField: SubField = {
        id: `sf_${Date.now()}`,
        label: 'New Sub-Field',
        type: 'text',
        required: false,
    };
    setSubFields([...subFields, newSubField]);
  };
  
  const handleRemoveSubField = (id: string) => {
    setSubFields(subFields.filter(sf => sf.id !== id));
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>Composite Field Builder</CardTitle>
                <CardDescription>
                    Define the sub-fields that make up this composite field.
                </CardDescription>
            </div>
            <Button onClick={handleAddSubField} size="sm" className="bg-accent hover:bg-accent/90">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Sub-Field
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
            {subFields.length === 0 ? (
                <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed">
                    <p className="text-muted-foreground">No sub-fields yet. Add one to get started.</p>
                </div>
            ) : (
                subFields.map((sf, index) => (
                    <div key={sf.id}>
                        <div className="grid grid-cols-12 gap-4 items-end p-4 border rounded-md">
                            <div className="col-span-4 grid gap-2">
                                <Label htmlFor={`sf-label-${sf.id}`}>Label</Label>
                                <Input id={`sf-label-${sf.id}`} defaultValue={sf.label} />
                            </div>
                             <div className="col-span-4 grid gap-2">
                                <Label htmlFor={`sf-type-${sf.id}`}>Type</Label>
                                <Select defaultValue={sf.type}>
                                    <SelectTrigger id={`sf-type-${sf.id}`}>
                                        <SelectValue placeholder="Select a type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="text">Text</SelectItem>
                                        <SelectItem value="textarea">Text Area</SelectItem>
                                        <SelectItem value="email">Email</SelectItem>
                                        <SelectItem value="date">Date</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-2 flex items-center gap-2 pb-2">
                                <Switch id={`sf-required-${sf.id}`} defaultChecked={sf.required}/>
                                <Label htmlFor={`sf-required-${sf.id}`}>Required</Label>
                            </div>
                            <div className="col-span-2 flex justify-end">
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveSubField(sf.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
      </CardContent>
    </Card>
  );
}
