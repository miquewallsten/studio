'use client';

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
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

type SubField = {
  id: string;
  label: string;
  type: string;
};

interface SubFieldsEditorProps {
  title: string;
  description: string;
  subFields: SubField[];
  onSubFieldsChange: (subFields: SubField[]) => void;
}

export default function SubFieldsEditor({
  title,
  description,
  subFields,
  onSubFieldsChange,
}: SubFieldsEditorProps) {

  const handleAddSubField = () => {
    const newSubField: SubField = {
      id: `sf_${Date.now()}`,
      label: 'New Sub-Field',
      type: 'text',
    };
    onSubFieldsChange([...subFields, newSubField]);
  };

  const handleRemoveSubField = (id: string) => {
    onSubFieldsChange(subFields.filter((sf) => sf.id !== id));
  };

  const handleSubFieldChange = (id: string, key: keyof SubField, value: any) => {
      const updatedSubFields = subFields.map(sf => 
        sf.id === id ? { ...sf, [key]: value } : sf
      );
      onSubFieldsChange(updatedSubFields);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              {description}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleAddSubField} size="sm" variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Sub-Field
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {subFields.length === 0 ? (
            <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed">
              <p className="text-muted-foreground">
                No sub-fields yet. Add one to get started.
              </p>
            </div>
          ) : (
            subFields.map((sf) => (
              <div key={sf.id}>
                <div className="grid grid-cols-12 items-end gap-4 rounded-md border p-4">
                  <div className="col-span-5 grid gap-2">
                    <Label htmlFor={`sf-label-${sf.id}`}>Label</Label>
                    <Input 
                        id={`sf-label-${sf.id}`} 
                        value={sf.label} 
                        onChange={(e) => handleSubFieldChange(sf.id, 'label', e.target.value)}
                    />
                  </div>
                  <div className="col-span-5 grid gap-2">
                    <Label htmlFor={`sf-type-${sf.id}`}>Type</Label>
                    <Select 
                        value={sf.type}
                        onValueChange={(value) => handleSubFieldChange(sf.id, 'type', value)}
                    >
                      <SelectTrigger id={`sf-type-${sf.id}`}>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="textarea">Text Area</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="file">File Upload</SelectItem>
                        <SelectItem value="boolean">Yes / No</SelectItem>
                        <SelectItem value="select">Select</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveSubField(sf.id)}
                    >
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
