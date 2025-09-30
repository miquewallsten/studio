'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
  } from '@/components/ui/card';
  import { Badge } from '@/components/ui/badge';
  import { Button } from '@/components/ui/button';
  import { FileUp, MessageSquare, UserPlus } from 'lucide-react';
  import { useEffect, useState } from 'react';
  import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
  import { db } from '@/lib/firebase';
  import { format } from 'date-fns';

  type Ticket = {
    id: string;
    subjectName: string;
    reportType: string;
    status: string;
    createdAt: Timestamp;
    description: string;
    clientEmail: string;
  };
  
  export default function TicketDetailPage({ params }: { params: { id: string } }) {
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const ticketRef = doc(db, 'tickets', params.id);
      const unsubscribe = onSnapshot(ticketRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTicket({
            id: docSnap.id,
            subjectName: data.subjectName,
            reportType: data.reportType,
            status: data.status,
            createdAt: data.createdAt,
            description: data.description,
            clientEmail: data.clientEmail || 'N/A',
          });
        }
        setLoading(false);
      });
  
      return () => unsubscribe();
    }, [params.id]);

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'New': return 'destructive';
            case 'Completed': return 'default';
            default: return 'secondary';
        }
    }
  
    if (loading) {
        return <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">Loading...</div>
    }

    if (!ticket) {
        return <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">Ticket not found.</div>
    }

    return (
      <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="grid gap-1">
                  <CardTitle className="text-2xl font-headline">
                    Investigation: {ticket.subjectName}
                  </CardTitle>
                  <CardDescription>
                    Ticket ID: {ticket.id.substring(0, 7)}
                  </CardDescription>
                </div>
                <Badge className="text-sm" variant={getStatusVariant(ticket.status)}>
                  {ticket.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                 <div>
                  <h3 className="font-semibold text-muted-foreground">Requested By</h3>
                  <p>{ticket.clientEmail}</p>
                </div>
                 <div>
                  <h3 className="font-semibold text-muted-foreground">Requested On</h3>
                  <p>{ticket.createdAt ? format(ticket.createdAt.toDate(), 'PPP') : ''}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-muted-foreground">Report Type</h3>
                  <p>{ticket.reportType}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-muted-foreground">Client Notes</h3>
                  <p className="text-sm">
                    {ticket.description || 'No notes provided.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Activity Feed</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex h-40 items-center justify-center rounded-md border border-dashed">
                    <p className="text-sm text-muted-foreground flex items-center gap-2"><MessageSquare className="size-4"/> No activity yet.</p>
                </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analyst Actions</CardTitle>
              <CardDescription>
                For internal use by managers and analysts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button className="w-full" variant="outline">
                    <UserPlus className="mr-2 size-4" /> Assign Analyst
                </Button>
                <Button className="w-full">
                    <FileUp className="mr-2 size-4" /> Upload Report
                </Button>
            </CardContent>
            <CardFooter>
                <p className="text-xs text-muted-foreground">This section is role-restricted.</p>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }