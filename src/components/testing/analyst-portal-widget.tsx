
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, onSnapshot, query, where, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

type Ticket = {
  id: string;
  subjectName: string;
  reportType: string;
  status: string;
  createdAt: Timestamp;
  assignedAnalystId?: string;
  analyst?: {
    uid: string;
    email: string;
  }
};

interface AnalystPortalWidgetProps {
    title: string;
    description: string;
}

export function AnalystPortalWidget({ title, description }: AnalystPortalWidgetProps) {
  const [user, loadingAuth] = useAuthState(auth);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'tickets'),
      where('status', '==', 'In Progress')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketsData: Ticket[] = [];
      snapshot.forEach((doc) => {
        ticketsData.push({ id: doc.id, ...doc.data() } as Ticket);
      });
      setTickets(ticketsData.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
      try {
        const ticketRef = doc(db, 'tickets', ticketId);
        await updateDoc(ticketRef, { status: newStatus });
        toast({
            title: 'Ticket Updated',
            description: `Status changed to "${newStatus}"`
        });
      } catch (error) {
        toast({
            title: 'Error',
            description: 'Failed to update ticket status',
            variant: 'destructive'
        })
      }
  }

  const role = (user?.stsTokenManager as any)?.claims?.role;
  const isAnalyst = role === 'Analyst';
  const assignedTickets = tickets.filter(t => t.assignedAnalystId === user?.uid);

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
            ) : !isAnalyst ? (
                 <div className="h-24 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Impersonated user is not an Analyst.</p>
                </div>
            ) : (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Report Type</TableHead>
                    <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">
                                <Skeleton className="h-6 w-1/2 mx-auto" />
                            </TableCell>
                        </TableRow>
                    ) : assignedTickets.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">
                                No tickets assigned to you.
                            </TableCell>
                        </TableRow>
                    ) : (
                        assignedTickets.map((ticket) => (
                            <TableRow key={ticket.id}>
                                <TableCell className="font-medium">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="cursor-pointer">{ticket.subjectName}</span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Created: {format(ticket.createdAt.toDate(), 'PPP')}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </TableCell>
                                <TableCell>{ticket.reportType}</TableCell>
                                <TableCell className="flex gap-2">
                                     <Button variant="outline" size="sm" onClick={() => toast({title: 'Note Added (Simulated)'})}>
                                        Add Note
                                    </Button>
                                    <Button size="sm" onClick={() => handleStatusChange(ticket.id, 'Pending Review')}>
                                        Submit for Review
                                    </Button>
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
