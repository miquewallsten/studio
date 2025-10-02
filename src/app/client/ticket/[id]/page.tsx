'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { doc, onSnapshot, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendEmail } from '@/ai/flows/send-email-flow';
import { cn } from '@/lib/utils';

type Ticket = {
  id: string;
  subjectName: string;
  reportType: string;
  status: string;
  createdAt: Timestamp;
  reportUrl?: string;
  rating?: number;
};

export default function ClientTicketDetailPage({ params }: { params: { id: string } }) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const ticketRef = doc(db, 'tickets', params.id);
    const unsubscribe = onSnapshot(ticketRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Ticket;
        setTicket({ id: docSnap.id, ...data });
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
  
  const handleRating = async (rating: number) => {
    if (!ticket || ticket.rating) return;
    
    try {
        const ticketRef = doc(db, 'tickets', ticket.id);
        await updateDoc(ticketRef, {
            rating: rating,
            ratingSubmittedAt: Timestamp.now(),
        });

        toast({
            title: 'Thank You!',
            description: `You've rated this report ${rating} out of 5 stars.`,
        });

        // If rating is low, send an email to execs
        if (rating <= 3) {
             await sendEmail({
                to: 'executives@example.com', // Replace with actual exec email or distribution list
                subject: `Low Rating Alert: Ticket ${ticket.id}`,
                html: `
                    <p>A low rating of <strong>${rating} stars</strong> was just submitted for ticket #${ticket.id}.</p>
                    <p><strong>Subject:</strong> ${ticket.subjectName}</p>
                    <p><strong>Report Type:</strong> ${ticket.reportType}</p>
                    <p>Please review the ticket and consider following up with the client.</p>
                `
            });
        }
    } catch(err) {
        console.error("Failed to save rating:", err);
        toast({
            title: 'Error',
            description: 'Could not submit your rating. Please try again.',
            variant: 'destructive',
        })
    }
  }


  if (loading) {
    return (
        <div className="flex-1 space-y-4">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/4" />
                </CardHeader>
                <CardContent>
                     <Skeleton className="h-40 w-full" />
                </CardContent>
            </Card>
        </div>
    )
  }

  if (!ticket) {
    return <div className="flex-1 space-y-4">Ticket not found.</div>
  }

  return (
    <div className="flex-1 space-y-4">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="grid gap-1">
                <CardTitle className="text-2xl font-headline">
                  Report for: {ticket.subjectName}
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
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h3 className="font-semibold text-muted-foreground">Report Type</h3>
                  <p>{ticket.reportType}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-muted-foreground">Requested On</h3>
                  <p>{ticket.createdAt ? format(ticket.createdAt.toDate(), 'PPP') : ''}</p>
                </div>
              </div>

            {ticket.status === 'Completed' ? (
                <>
                {ticket.reportUrl && (
                    <div className="pt-6">
                        <h3 className="text-lg font-semibold mb-2">Final Report</h3>
                        <div className="border rounded-lg p-4 flex items-center justify-between">
                            <div>
                                <p className="font-medium">The background check report is ready.</p>
                                <p className="text-sm text-muted-foreground">Click the button to download the final document.</p>
                            </div>
                            <Button>
                                <Download className="mr-2" />
                                Download Report
                            </Button>
                        </div>
                    </div>
                )}
                 <div className="pt-6">
                    <h3 className="text-lg font-semibold mb-2">Rate Our Service</h3>
                    <div className="border rounded-lg p-4 flex items-center justify-between">
                        <div>
                            <p className="font-medium">How was your experience with this report?</p>
                            <p className="text-sm text-muted-foreground">Your feedback helps us improve.</p>
                        </div>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button key={star} onClick={() => handleRating(star)} disabled={!!ticket.rating}>
                                    <Star className={cn(
                                        "size-6 transition-colors",
                                        ticket.rating && star <= ticket.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300",
                                        !ticket.rating && "hover:text-yellow-300 cursor-pointer"
                                    )}/>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                </>
            ) : (
                <div className="pt-6">
                     <h3 className="text-lg font-semibold mb-2">Report Status</h3>
                     <div className="border rounded-lg p-4 text-center">
                        <p className="text-muted-foreground">The report is not yet available. Current status: <span className="font-semibold">{ticket.status}</span></p>
                     </div>
                </div>
            )}
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
