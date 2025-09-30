'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';
import SubFieldsEditor from '@/components/sub-fields-editor';
import { Textarea } from '@/components/ui/textarea';

type SubField = {
  id: string;
  label: string;
  type: string;
};

export default function NewFieldPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [label, setLabel] = useState('');
  const [type, setType] = useState('');
  const [subFields, setSubFields] = useState<SubField[]>([]);
  const [aiInstructions, setAiInstructions] = useState('');
  const [internalFields, setInternalFields] = useState<SubField[]>([]);


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

      router.push(`/dashboard/fields`);

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
    <div className="mx-auto grid w-full max-w-4xl gap-4">
      <h1 className="text-3xl font-semibold font-headline">Create New Library Field</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Field Details</CardTitle>
              <CardDescription>
                Define a new reusable field for your library.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
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
            </CardContent>
          </Card>

          {type === 'composite' && (
            <SubFieldsEditor 
              title="Composite Field Builder"
              description="Define the user-facing sub-fields that make up this composite field."
              subFields={subFields}
              onSubFieldsChange={setSubFields}
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
                    value={aiInstructions}
                    onChange={(e) => setAiInstructions(e.target.value)}
                    className="min-h-24 font-mono text-xs"
                />
             </CardContent>
          </Card>

           <SubFieldsEditor 
              title="Internal Analyst Fields"
              description="Define fields that are only visible to internal analysts for notes and validation."
              subFields={internalFields}
              onSubFieldsChange={setInternalFields}
            />

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/fields">Cancel</Link>
            </Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Field to Library'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
