
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './columns';
import type { Form } from './schema';
import { useRouter } from 'next/navigation';

export default function FormsPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const q = query(collection(db, 'forms'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const formsData: Form[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        formsData.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          createdAt: data.createdAt?.toDate().toISOString(),
        });
      });
      setForms(formsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleRowClick = (row: any) => {
    router.push(`/dashboard/forms/${row.original.id}`);
  };

  const memoizedColumns = useMemo(() => columns, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Form Templates</h1>
        <Button asChild className="bg-accent hover:bg-accent/90">
            <Link href="/dashboard/forms/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Form Template
            </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Form Templates</CardTitle>
          <CardDescription>
            Manage the form templates used for background checks and screenings. Click a row to edit a form.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading forms...</p>
          ) : (
            <DataTable 
                columns={memoizedColumns} 
                data={forms}
                onRowClick={handleRowClick}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
