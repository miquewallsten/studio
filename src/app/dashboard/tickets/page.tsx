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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, ArrowRight, Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';

type Ticket = {
  id: string;
  subjectName: string;
  reportType: string;
  status: string;
  createdAt: Timestamp;
};

export default function TicketsPage() {
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
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
      setAllTickets(ticketsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredTickets = useMemo(() => {
    return allTickets.filter((ticket) => {
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
      const matchesSearch = ticket.subjectName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [allTickets, statusFilter, searchQuery]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'New':
        return 'destructive';
      case 'Completed':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const renderTableRows = (tickets: Ticket[]) => {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="h-24 text-center">
            Loading tickets...
          </TableCell>
        </TableRow>
      );
    }
    if (tickets.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="h-24 text-center">
            No tickets found.
          </TableCell>
        </TableRow>
      );
    }
    return tickets.map((ticket) => (
      <TableRow key={ticket.id}>
        <TableCell className="font-medium">{ticket.subjectName}</TableCell>
        <TableCell>{ticket.reportType}</TableCell>
        <TableCell>
          <Badge variant={getStatusVariant(ticket.status)}>{ticket.status}</Badge>
        </TableCell>
        <TableCell>
          {ticket.createdAt ? format(ticket.createdAt.toDate(), 'PPP') : ''}
        </TableCell>
        <TableCell className="text-right">
          <Button asChild variant="ghost" size="icon">
            <Link href={`/dashboard/tickets/${ticket.id}`}>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </TableCell>
      </TableRow>
    ));
  }

  return (
    <Tabs defaultValue="all" onValueChange={setStatusFilter} className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold font-headline">Tickets</h1>
            <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="New">New</TabsTrigger>
                <TabsTrigger value="In Progress">In Progress</TabsTrigger>
                <TabsTrigger value="Pending Review">Pending Review</TabsTrigger>
                <TabsTrigger value="Completed">Completed</TabsTrigger>
            </TabsList>
        </div>
        <div className="flex items-center gap-2">
            <div className="relative">
                 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                 <Input 
                    type="search"
                    placeholder="Search by subject..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                 />
            </div>
            <Button asChild className="bg-accent hover:bg-accent/90">
                <Link href="/dashboard/tickets/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Ticket
                </Link>
            </Button>
        </div>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Report Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderTableRows(filteredTickets)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Tabs>
  );
}
