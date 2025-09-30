'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { writeBatch, doc, collection } from 'firebase/firestore';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

// Define the structure of a Field
interface Field {
  label: string;
  type: 'text' | 'email' | 'file' | 'textarea' | 'date';
  required: boolean;
  order: number;
  placeholder?: string;
}

// Define the structure of a Form
interface Form {
  name: string;
  description: string;
  fields: Field[];
}

const formsToSeed: Form[] = [
  {
    name: 'Tenant Screening',
    description: 'A comprehensive screening form for potential tenants.',
    fields: [
      { label: 'Full Name', type: 'text', required: true, order: 1, placeholder: 'John Doe' },
      { label: 'Email Address', type: 'email', required: true, order: 2, placeholder: 'john.doe@example.com' },
      { label: 'Current Address', type: 'textarea', required: true, order: 3 },
      { label: 'Date of Birth', type: 'date', required: true, order: 4 },
      { label: 'Photo ID (Driver\'s License, etc.)', type: 'file', required: true, order: 5 },
      { label: 'Proof of Income (Pay Stub)', type: 'file', required: false, order: 6 },
    ],
  },
  {
    name: 'Employment Verification',
    description: 'Form to verify a candidate\'s employment history.',
    fields: [
      { label: 'Full Name', type: 'text', required: true, order: 1, placeholder: 'Jane Smith' },
      { label: 'Email Address', type: 'email', required: true, order: 2, placeholder: 'jane.smith@example.com' },
      { label: 'Social Security Number (SSN)', type: 'text', required: true, order: 3, placeholder: 'XXX-XX-XXXX' },
      { label: 'CV / Resume', type: 'file', required: true, order: 4 },
      { label: 'Previous Employer Details', type: 'textarea', required: true, order: 5, placeholder: 'Company Name, Role, Dates' },
    ],
  },
];

export default function SeedFormsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSeed = async () => {
    setIsLoading(true);
    const batch = writeBatch(db);

    try {
      formsToSeed.forEach(form => {
        const formRef = doc(collection(db, 'forms'));
        batch.set(formRef, {
          name: form.name,
          description: form.description,
        });

        form.fields.forEach(field => {
          const fieldRef = doc(collection(formRef, 'fields'));
          batch.set(fieldRef, field);
        });
      });

      await batch.commit();

      toast({
        title: 'Success!',
        description: 'Your Firestore database has been seeded with initial form data.',
      });
    } catch (error) {
      console.error('Error seeding database:', error);
      toast({
        title: 'Error',
        description: 'Failed to seed the database. Check the console for details.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="mx-auto w-full max-w-lg">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Seed Database</CardTitle>
                <CardDescription>
                    Click the button below to populate your Firestore database with the initial form structures. This is a one-time setup action.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                    This will create a `forms` collection with two sample forms ("Tenant Screening" and "Employment Verification") and their corresponding fields.
                </p>
                <Button onClick={handleSeed} disabled={isLoading} className="w-full">
                    {isLoading ? 'Seeding...' : 'Seed Form Data'}
                </Button>
                <div className="mt-4 text-center text-sm">
                    Go back to the {' '}
                    <Link href="/dashboard" className="underline">
                    Dashboard
                    </Link>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
