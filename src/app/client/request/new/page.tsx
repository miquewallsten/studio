
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSecureFetch } from '@/hooks/use-secure-fetch';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';

type FormTemplate = {
    id: string;
    name: string;
}

export default function NewRequestPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const secureFetch = useSecureFetch();
  const [user, loadingUser] = useAuthState(auth);
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([]);

  useEffect(() => {
    const fetchForms = async () => {
      const q = query(collection(db, "forms"));
      const querySnapshot = await getDocs(q);
      const templates: FormTemplate[] = [];
      querySnapshot.forEach((doc) => {
        templates.push({ id: doc.id, name: doc.data().name });
      });
      setFormTemplates(templates);
    };
    fetchForms();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData(event.currentTarget);
    const subjectName = formData.get('subject-name') as string;
    const email = formData.get('email') as string;
    const reportType = formData.get('report-type') as string; // This is now the Form Template ID
    const description = formData.get('description') as string;

    if (!user) {
        toast({
            title: 'Error',
            description: 'You must be logged in to create a request.',
            variant: 'destructive',
        });
        setIsLoading(false);
        return;
    }

    try {
        const selectedTemplate = formTemplates.find(t => t.id === reportType);
        
        const res = await secureFetch('/api/client/tickets/create', {
            method: 'POST',
            body: JSON.stringify({
                subjectName,
                email,
                reportType: selectedTemplate?.name || 'Custom Request', // Send the name as the report type
                formId: reportType, // Send the form ID
                description,
            }),
        });

        const data = await res.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

      toast({
        title: 'Request Created',
        description: `A new form has been dispatched to ${email}.`,
        variant: 'default',
      });

      router.push('/client/dashboard');

    } catch (error: any) {
      console.error('Error creating request:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create request. Please try again.',
        variant: 'destructive',
      });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-2">
      <h1 className="text-3xl font-semibold font-headline">Create New Request</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Investigation Subject</CardTitle>
              <CardDescription>
                Provide details about the person or company to be investigated.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="subject-name">Subject Name/Company</Label>
                <Input id="subject-name" name="subject-name" required disabled={isLoading} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Subject's Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="The form will be sent to this email"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="report-type">Form Template</Label>
                <Select name="report-type" required disabled={isLoading}>
                  <SelectTrigger id="report-type">
                    <SelectValue placeholder="Select a form template" />
                  </SelectTrigger>
                  <SelectContent>
                    {formTemplates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                            {template.name}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description & Notes</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Include any specific instructions or details."
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" asChild>
                <Link href="/client/dashboard">Cancel</Link>
            </Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create and Send Form'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
