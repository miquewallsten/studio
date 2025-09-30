
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FilePenLine, UserCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Skeleton } from '@/components/ui/skeleton';
import FormPage from '@/app/form/[ticketId]/page';

type Ticket = {
  id: string;
  subjectName: string;
  reportType: string;
  status: string;
  createdAt: Timestamp;
};

export function EndUserPortalWidget() {
  const [user, loadingUser] = useAuthState(auth);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    if (user) {
      const q = query(
        collection(db, 'tickets'),
        where('endUserId', '==', user.uid),
        where('status', '==', 'New')
      );
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const ticketsData: Ticket[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            ticketsData.push({
              id: doc.id,
              subjectName: data.subjectName,
              reportType: data.reportType,
              status: data.status,
              createdAt: data.createdAt,
            });
          });
          setTickets(ticketsData.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching end-user tickets:', error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } else {
      // If no user is impersonated, we show all "New" tickets as a proxy
      const q = query(
        collection(db, 'tickets'),
        where('status', '==', 'New')
      );
       const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const ticketsData: Ticket[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            ticketsData.push({
              id: doc.id,
              subjectName: data.subjectName,
              reportType: data.reportType,
              status: data.status,
              createdAt: data.createdAt,
            });
          });
          setTickets(ticketsData.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
          setLoading(false);
        }, (error) => {
            console.error('Error fetching all new tickets:', error);
            setLoading(false);
        });
        return () => unsubscribe();
    }
  }, [user]);

  const handleFormSubmitted = () => {
    setSelectedTicketId(null);
    // The onSnapshot listener will automatically update the list.
  }

  const renderContent = () => {
    if (loadingUser || loading) {
      return (
        <div className="p-4 space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
        </div>
      );
    }

    if (!user) {
         return (
             <div className="flex items-center justify-center h-full text-center p-4">
                <div>
                    <UserCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-sm text-muted-foreground">
                        No user impersonated.
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Showing all pending forms. Impersonate an End-User to see their specific view.
                    </p>
                </div>
            </div>
      );
    }
    
    return null; // The table will be shown outside this conditional
  };


  return (
    <>
    <Dialog open={!!selectedTicketId} onOpenChange={(open) => !open && setSelectedTicketId(null)}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>Fill Information Request Form</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-auto -mx-6 px-6">
             {selectedTicketId && <FormPage params={{ticketId: selectedTicketId}} onFormSubmitted={handleFormSubmitted} />}
            </div>
        </DialogContent>
    </Dialog>
    <Card className="h-full flex flex-col non-draggable">
      <CardHeader>
        <CardTitle>3. End-User Portal</CardTitle>
        <CardDescription className="text-xs">
          {user ? `Viewing as: ${user.email}`: "Pending forms for all End-Users."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-2">
        {renderContent()}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Subject / Report</TableHead>
              <TableHead className="text-right text-xs">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center text-sm">
                  No pending forms.
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium text-xs py-2">
                    <p>{ticket.subjectName}</p>
                    <p className="text-muted-foreground">{ticket.reportType}</p>
                  </TableCell>
                  <TableCell className="text-right py-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedTicketId(ticket.id)}>
                        <FilePenLine className="mr-2"/>
                        Fill Form
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    </>
  );
}
