
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
import { User } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '../ui/dropdown-menu';

type Ticket = {
  id: string;
  subjectName: string;
  reportType: string;
  status: string;
  createdAt: Timestamp;
};

type PortalUser = {
    uid: string;
    email?: string;
}

interface EndUserPortalWidgetProps {
    users: PortalUser[];
    onImpersonate: (uid: string, email?: string) => void;
    isImpersonating: boolean;
}

export function EndUserPortalWidget({ users, onImpersonate, isImpersonating }: EndUserPortalWidgetProps) {
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
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <CardTitle>End-User Portal</CardTitle>
                    <CardDescription>
                        Impersonate an end-user to see and fill out their pending forms.
                    </CardDescription>
                </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            <User className="mr-2"/>
                            {user && isEndUser ? user.email : "Impersonate End-User"}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                        <DropdownMenuLabel>Select an End-User</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {users.map(u => (
                            <DropdownMenuItem key={u.uid} onClick={() => onImpersonate(u.uid, u.email)} disabled={isImpersonating}>
                                {u.email}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
             {loadingAuth ? (
                <div className="h-24 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Loading user data...</p>
                </div>
            ) : !isEndUser ? (
                 <div className="h-24 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Select an end-user to impersonate.</p>
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
                            No pending forms for this user.
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
