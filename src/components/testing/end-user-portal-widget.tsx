
'use client';

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
import { Button } from '@/components/ui/button';
import FormPage from '@/app/form/[ticketId]/page';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';

type Ticket = {
  id: string;
  subjectName: string;
  reportType: string;
  status: string;
  createdAt: Timestamp;
};

interface EndUserPortalWidgetProps {
    title: string;
    description: string;
}

export function EndUserPortalWidget({ title, description }: EndUserPortalWidgetProps) {
  const [user, loadingAuth] = useAuthState(auth);
  const [pendingForms, setPendingForms] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setLoading(true);
      const q = query(
        collection(db, 'tickets'),
        where('endUserId', '==', user.uid),
        where('status', '==', 'New')
      );
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const formsData: Ticket[] = [];
        querySnapshot.forEach((doc) => {
          formsData.push({ id: doc.id, ...doc.data() } as Ticket);
        });
        setPendingForms(formsData);
        setLoading(false);
      });

      return () => unsubscribe();
    } else if (!loadingAuth) {
      setLoading(false);
      setPendingForms([]);
    }
  }, [user, loadingAuth]);
  
  const handleFormSubmitted = () => {
    setSelectedTicketId(null);
  }

  const role = (user?.stsTokenManager as any)?.claims?.role;
  const isEndUser = role === 'End User';

  if (selectedTicketId) {
      return (
          <Card className="h-full flex flex-col non-draggable">
              <CardHeader>
                  <Button variant="link" onClick={() => setSelectedTicketId(null)} className="p-0 h-auto justify-start">&lt; Back to list</Button>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                <FormPage params={{ticketId: selectedTicketId}} onFormSubmitted={handleFormSubmitted} />
              </CardContent>
          </Card>
      )
  }

  return (
    <Card className="h-full flex flex-col non-draggable">
        <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
                {description}
                {user && <div className="mt-2 text-xs font-semibold p-2 bg-muted rounded-md border">Viewing as: {user.email} <span className="text-muted-foreground font-normal">(Use Widget 1 to impersonate a different user.)</span></div>}
            </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
             {loadingAuth ? (
                <div className="h-24 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Loading user data...</p>
                </div>
            ) : !user ? (
                 <div className="h-24 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">No user impersonated. Use Widget 1.</p>
                </div>
            ) : !isEndUser ? (
                <div className="h-24 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Impersonated user is not an End-User.</p>
                </div>
            ) : (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Form Type</TableHead>
                    <TableHead>Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={2} className="h-24 text-center">
                            Loading forms...
                            </TableCell>
                        </TableRow>
                    ) : pendingForms.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={2} className="h-24 text-center">
                            No pending forms.
                            </TableCell>
                        </TableRow>
                    ) : (
                        pendingForms.map((form) => (
                            <TableRow key={form.id}>
                            <TableCell className="font-medium">
                                {form.reportType}
                            </TableCell>
                            <TableCell>
                               <Button variant="outline" onClick={() => setSelectedTicketId(form.id)}>Fill Out Form</Button>
                            </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
                </Table>
            )}
        </CardContent>
    </Card>
  );
}

    