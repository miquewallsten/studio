
'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';
import SubFieldsEditor from '@/components/sub-fields-editor';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from './ui/scroll-area';

type SubField = {
  id: string;
  label: string;
  type: string;
};

interface NewFieldDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onFieldCreated: () => void;
}

export function NewFieldDialog({ isOpen, onOpenChange, onFieldCreated }: NewFieldDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [label, setLabel] = useState('');
  const [type, setType] = useState('');
  const [subFields, setSubFields] = useState<SubField[]>([]);
  const [aiInstructions, setAiInstructions] = useState('');
  const [internalFields, setInternalFields] = useState<SubField[]>([]);

  const resetForm = () => {
    setLabel('');
    setType('');
    setSubFields([]);
    setAiInstructions('');
    setInternalFields([]);
    setIsLoading(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    if (!label || !type) {
      toast({
        title: 'Error',
        description: 'Label and Type are required.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    try {
      const fieldData: any = {
        label,
        type,
        aiInstructions,
        internalFields,
        createdAt: serverTimestamp(),
      };

      if (type === 'composite') {
        fieldData.subFields = subFields;
      }

      const docRef = await addDoc(collection(db, 'fields'), fieldData);

      toast({
        title: 'Field Created',
        description: `The "${label}" field has been added to your library.`,
      });

      onFieldCreated();
      handleOpenChange(false);

    } catch (error) {
      console.error('Error creating field:', error);
      toast({
        title: 'Error',
        description: 'Failed to create field. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Library Field</DialogTitle>
            <DialogDescription>
              Define a new reusable field for your library.
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[70vh] overflow-y-auto p-1 pr-4">
            <div className="grid gap-6 py-4 ">
                <div className="grid gap-4 p-1">
                  <div className="grid gap-2">
                    <Label htmlFor="field-label">Field Label</Label>
                    <Input
                      id="field-label"
                      name="field-label"
                      required
                      disabled={isLoading}
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder="e.g., Social Security Number"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="field-type">Field Type</Label>
                    <Select
                      name="field-type"
                      required
                      disabled={isLoading}
                      onValueChange={setType}
                      value={type}
                    >
                      <SelectTrigger id="field-type">
                        <SelectValue placeholder="Select a field type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="textarea">Text Area</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="file">File Upload</SelectItem>
                        <SelectItem value="selfie">Selfie Capture</SelectItem>
                        <SelectItem value="composite">Composite Field</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

              {type === 'composite' && (
                <SubFieldsEditor 
                  title="Composite Field Builder"
                  description="Define the user-facing sub-fields that make up this composite field."
                  subFields={subFields}
                  onSubFieldsChange={setSubFields}
                />
              )}
               {type === 'file-extraction' && (
                <SubFieldsEditor 
                  title="Fields to Extract"
                  description="Define the fields the AI should try to extract from the uploaded document."
                  subFields={subFields}
                  onSubFieldsChange={setSubFields}
                />
              )}


              <div>
                  <Label htmlFor="ai-instructions" className="text-base font-semibold">AI Automation</Label>
                  <p className="text-sm text-muted-foreground mb-2">Provide instructions for AI tools to automate validation for this field.</p>
                    <Textarea
                        id="ai-instructions"
                        placeholder="e.g., Scrape https://gov-site.com/validate?curp={{value}} and check for a 'valid' status."
                        value={aiInstructions}
                        onChange={(e) => setAiInstructions(e.target.value)}
                        className="min-h-24 font-mono text-xs"
                    />
              </div>

              <SubFieldsEditor 
                  title="Internal Analyst Fields"
                  description="Define fields that are only visible to internal analysts for notes and validation."
                  subFields={internalFields}
                  onSubFieldsChange={setInternalFields}
                />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => handleOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Field to Library'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
