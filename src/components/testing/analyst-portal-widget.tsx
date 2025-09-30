
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, onSnapshot, query, where, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '../ui/dropdown-menu';
import { User } from 'lucide-react';


type Ticket = {
  id: string;
  subjectName: string;
  reportType: string;
  status: string;
  createdAt: Timestamp;
  assignedAnalystId?: string;
};

type PortalUser = {
    uid: string;
    email?: string;
}

interface AnalystPortalWidgetProps {
    users: PortalUser[];
    onImpersonate: (uid: string, email?: string) => void;
    isImpersonating: boolean;
}

export function AnalystPortalWidget({ users, onImpersonate, isImpersonating }: AnalystPortalWidgetProps) {
  const [user, loadingAuth] = useAuthState(auth);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
        setLoading(true);
        const role = (user?.stsTokenManager as any)?.claims?.role;
        if (role !== 'Analyst') {
            setLoading(false);
            setTickets([]);
            return;
        }


        const q = query(
        collection(db, 'tickets'),
        where('status', '==', 'In Progress'),
        where('assignedAnalystId', '==', user.uid)
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
    } else {
        setLoading(false);
        setTickets([]);
    }
  }, [user]);

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
  const assignedTickets = tickets;

  return (
    <Card className="h-full flex flex-col non-draggable">
        <CardHeader>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <CardTitle>Analyst Portal</CardTitle>
                    <CardDescription>
                        Impersonate an analyst to see their assigned tickets and submit work for review.
                    </CardDescription>
                </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            <User className="mr-2"/>
                            {user && isAnalyst ? user.email : "Impersonate Analyst"}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                        <DropdownMenuLabel>Select an Analyst</DropdownMenuLabel>
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
            ) : !isAnalyst ? (
                 <div className="h-24 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Select an analyst to impersonate.</p>
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
                                Loading tickets...
                            </TableCell>
                        </TableRow>
                    ) : assignedTickets.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">
                                No tickets assigned to this analyst.
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
