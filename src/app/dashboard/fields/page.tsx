'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PlusCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';

type Field = {
  id: string;
  label: string;
  type: string;
  required: boolean;
};

export default function FieldsPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'fields'), orderBy('label'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fieldsData: Field[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fieldsData.push({
          id: doc.id,
          label: data.label,
          type: data.type,
          required: data.required,
        });
      });
      setFields(fieldsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col gap-4">
       <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold font-headline">Field Library</h1>
            <Button asChild className="bg-accent hover:bg-accent/90">
                <Link href="/dashboard/fields/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Field
                </Link>
            </Button>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>Reusable Fields</CardTitle>
          <CardDescription>
            Manage the reusable fields that can be added to any form template.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Loading fields...
                  </TableCell>
                </TableRow>
              ) : fields.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No fields found. Create your first reusable field.
                  </TableCell>
                </TableRow>
              ) : (
                fields.map((field) => (
                  <TableRow key={field.id}>
                    <TableCell className="font-medium">{field.label}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{field.type}</Badge>
                    </TableCell>
                    <TableCell>{field.required ? 'Yes' : 'No'}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="icon">
                        {/* This will eventually link to the field editor */}
                        <Link href={`/dashboard/fields/${field.id}`}>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
