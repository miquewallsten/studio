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
import { PlusCircle, ArrowRight, Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Input } from '@/components/ui/input';

type Form = {
  id: string;
  name: string;
  description: string;
};

export default function FormsPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'forms'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const formsData: Form[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        formsData.push({
          id: doc.id,
          name: data.name,
          description: data.description,
        });
      });
      setForms(formsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredForms = useMemo(() => {
    return forms.filter((form) =>
      form.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [forms, searchQuery]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Forms</h1>
        <div className="flex items-center gap-2">
            <div className="relative">
                 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                 <Input 
                    type="search"
                    placeholder="Search by name..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                 />
            </div>
            <Button asChild className="bg-accent hover:bg-accent/90">
                <Link href="/dashboard/forms/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Form
                </Link>
            </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Form Templates</CardTitle>
          <CardDescription>
            Manage the form templates used for background checks and screenings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Form Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    Loading forms...
                  </TableCell>
                </TableRow>
              ) : filteredForms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No forms found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredForms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell className="font-medium">{form.name}</TableCell>
                    <TableCell>{form.description}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="icon">
                        <Link href={`/dashboard/forms/${form.id}`}>
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
