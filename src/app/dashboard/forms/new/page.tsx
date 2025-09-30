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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';

export default function NewFormPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    if (!formName) {
      toast({
        title: 'Error',
        description: 'Form Name is required.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    try {
      await addDoc(collection(db, 'forms'), {
        name: formName,
        description: formDescription,
        createdAt: serverTimestamp(),
      });

      toast({
        title: 'Form Template Created',
        description: `The "${formName}" template has been saved.`,
      });

      router.push('/dashboard/forms');
    } catch (error)
    {
      console.error('Error creating form template:', error);
      toast({
        title: 'Error',
        description: 'Failed to create form template. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-2">
      <h1 className="text-3xl font-semibold font-headline">Create New Form Template</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Form Details</CardTitle>
              <CardDescription>
                Define the name and description for your new form template. You can add fields after creating it.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="form-name">Form Name</Label>
                <Input 
                  id="form-name" 
                  name="form-name" 
                  required 
                  disabled={isLoading}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="form-description">Description</Label>
                <Textarea
                  id="form-description"
                  name="form-description"
                  placeholder="A brief description of what this form is for."
                  disabled={isLoading}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/forms">Cancel</Link>
            </Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Form Template'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
