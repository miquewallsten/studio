
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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FilePenLine, UserCircle, Edit, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  Timestamp,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';


type Ticket = {
  id: string;
  subjectName: string;
  reportType: string;
};

export function AnalystPortalWidget() {
  const [user, loadingUser] = useAuthState(auth);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'tickets'),
      where('status', '==', 'In Progress')
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
          });
        });
        setTickets(ticketsData.sort((a,b) => a.subjectName.localeCompare(b.subjectName)));
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching analyst tickets:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const submitForReview = async (ticketId: string) => {
    try {
        const ticketRef = doc(db, 'tickets', ticketId);
        await updateDoc(ticketRef, {
            status: 'Pending Review'
        });
        toast({
            title: 'Submitted for Review',
            description: 'The ticket has been moved to the manager\'s queue.'
        });
    } catch (error) {
        console.error('Error submitting for review:', error);
        toast({
            title: 'Error',
            description: 'Could not update the ticket status.',
            variant: 'destructive'
        });
    }
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
    
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Subject / Report</TableHead>
            <TableHead className="text-right text-xs">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.length === 0 && !loading ? (
            <TableRow>
              <TableCell colSpan={2} className="h-24 text-center text-sm">
                No tickets in progress.
              </TableCell>
            </TableRow>
          ) : (
            tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className="font-medium text-xs py-2">
                  <p>{ticket.subjectName}</p>
                  <p className="text-muted-foreground">{ticket.reportType}</p>
                </TableCell>
                <TableCell className="text-right py-2 space-x-1">
                  <Button variant="outline" size="icon" className="h-7 w-7">
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Add Note</span>
                  </Button>
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => submitForReview(ticket.id)}>
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Submit for Review</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    );
  };


  return (
    <Card className="h-full flex flex-col non-draggable">
      <CardHeader>
        <CardTitle>5. Analyst's Portal</CardTitle>
        <CardDescription className="text-xs">
          View tickets in progress and submit them for review.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-2">
        {renderContent()}
      </CardContent>
    </Card>
  );
}

    