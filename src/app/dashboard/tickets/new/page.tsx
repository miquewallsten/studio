
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
import { useState } from 'react';
import { useSecureFetch } from '@/hooks/use-secure-fetch';

export default function NewTicketPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const secureFetch = useSecureFetch();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData(event.currentTarget);
    const subjectName = formData.get('subject-name') as string;
    const email = formData.get('email') as string;
    const reportType = formData.get('report-type') as string;
    const description = formData.get('description') as string;

    try {
      // The API endpoint will handle the AI logic and ticket creation.
      const res = await secureFetch('/api/tickets', {
        method: 'POST',
        body: JSON.stringify({
          subjectName,
          email,
          reportType,
          description,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create ticket.');
      }
      
      toast({
        title: 'Ticket Created',
        description: `A new form has been dispatched to ${email}.`,
        variant: 'default',
      });

      router.push('/dashboard/tickets');

    } catch (error: any) {
      console.error('Error creating ticket:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create ticket. Please try again.',
        variant: 'destructive',
      });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-2">
      <h1 className="text-3xl font-semibold font-headline">Create New Ticket</h1>

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
                <Label htmlFor="report-type">Report Type</Label>
                <Select name="report-type" required disabled={isLoading}>
                  <SelectTrigger id="report-type">
                    <SelectValue placeholder="Select a report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="background-check">
                      Background Check
                    </SelectItem>
                    <SelectItem value="tenant-screening">
                      Tenant Screening
                    </SelectItem>
                    <SelectItem value="employment-verification">
                      Employment Verification
                    </SelectItem>
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
                <Link href="/dashboard/tickets">Cancel</Link>
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
