
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
import { FilePenLine, UserCircle, Edit, Send, GanttChartSquare } from 'lucide-react';
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
import { Badge } from '../ui/badge';


type Ticket = {
  id: string;
  subjectName: string;
  reportType: string;
};

type Analyst = {
    uid: string;
    email: string;
    tickets: Ticket[];
}

export function AnalystWorkloadWidget() {
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);

    const fetchAnalystsAndTickets = async () => {
        try {
            const usersResponse = await fetch('/api/users');
            const usersData = await usersResponse.json();
            if (!usersResponse.ok) throw new Error('Failed to fetch users');
            
            const fetchedAnalysts: Analyst[] = usersData.users
                .filter((u: any) => u.role === 'Analyst')
                .map((u: any) => ({ uid: u.uid, email: u.email, tickets: [] }));

            const ticketsQuery = query(collection(db, 'tickets'), where('status', '==', 'In Progress'));
            const unsubscribe = onSnapshot(ticketsQuery, (querySnapshot) => {
                const ticketMap: {[key: string]: Ticket[]} = {};
                fetchedAnalysts.forEach(a => ticketMap[a.uid] = []);

                querySnapshot.forEach(doc => {
                    const ticket = { id: doc.id, ...doc.data() } as Ticket & { assignedAnalystId: string };
                    if (ticket.assignedAnalystId && ticketMap[ticket.assignedAnalystId]) {
                        ticketMap[ticket.assignedAnalystId].push(ticket);
                    }
                });

                const updatedAnalysts = fetchedAnalysts.map(a => ({
                    ...a,
                    tickets: ticketMap[a.uid] || []
                }));
                
                setAnalysts(updatedAnalysts);
                if (loading) setLoading(false);
            });

            return unsubscribe;

        } catch (error) {
            console.error("Error initializing analyst workload widget: ", error);
            if (loading) setLoading(false);
        }
    }
    
    const unsubscribePromise = fetchAnalystsAndTickets();
    
    return () => {
      unsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe());
    };
  }, []);


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
    if (loading) {
      return (
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
           <div className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      );
    }
    
    return (
        <div className="space-y-4">
        {analysts.map(analyst => (
            <div key={analyst.uid}>
                <h4 className="font-semibold text-sm px-2 flex items-center justify-between">
                    <span className="truncate">{analyst.email}</span>
                    <Badge variant="secondary">{analyst.tickets.length}</Badge>
                </h4>
                <Table>
                    <TableBody>
                    {analyst.tickets.length === 0 ? (
                        <TableRow>
                            <TableCell className="text-center text-xs text-muted-foreground py-4">No assigned tickets</TableCell>
                        </TableRow>
                    ) : (
                        analyst.tickets.map(ticket => (
                            <TableRow key={ticket.id}>
                                <TableCell className="text-xs py-1 px-2 font-medium truncate">{ticket.subjectName}</TableCell>
                                <TableCell className="text-right py-1 px-2">
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => submitForReview(ticket.id)}>
                                        <Send className="h-3 w-3" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                    </TableBody>
                </Table>
            </div>
        ))}
        </div>
    );
  };


  return (
    <Card className="h-full flex flex-col non-draggable">
      <CardHeader>
        <CardTitle>5. Analyst Workload</CardTitle>
        <CardDescription className="text-xs">
          This widget provides a manager's overview of the tickets assigned to each analyst.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-2">
        {analysts.length > 0 ? renderContent() : (
            <div className="flex items-center justify-center h-full text-center p-4">
                <div>
                    <GanttChartSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-sm text-muted-foreground">
                        No analysts found.
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Create users with the 'Analyst' role.
                    </p>
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
}

// Retaining the original export to avoid breaking imports, but it's now an alias.
export { AnalystWorkloadWidget as AnalystPortalWidget };
