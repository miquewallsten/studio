

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, Timestamp, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';

type Ticket = {
  id: string;
  subjectName: string;
  reportType: string;
  status: string;
  createdAt: Timestamp;
  description: string;
  clientEmail: string;
  endUserId: string;
  suggestedQuestions?: string[];
};

export default function FormPage({ params }: { params: { ticketId: string }}) {
  const [user, loadingAuth] = useAuthState(auth);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [actualTicketId, setActualTicketId] = useState(params.ticketId);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (loadingAuth) return;
    
    const getTicketData = async () => {
      setLoading(true);

      let ticketIdToFetch = actualTicketId;
      let ticketRef;

      // Special case for widget view where we don't have the real ticket ID
      if (ticketIdToFetch === 'some-ticket-id') {
        if (!user) {
           setLoading(false);
           setTicket(null);
           return;
        }
        // Find the first available form for the current user
        const q = query(
            collection(db, 'tickets'), 
            where('endUserId', '==', user.uid), 
            where('status', '==', 'New'),
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            ticketIdToFetch = doc.id;
            setActualTicketId(doc.id); // Update state with real ID
            ticketRef = doc.ref;
        } else {
             setLoading(false);
             setTicket(null); // No forms for this user
             return;
        }
      } else {
          ticketRef = doc(db, 'tickets', ticketIdToFetch);
      }


      const ticketSnap = await getDoc(ticketRef);

      if (ticketSnap.exists()) {
        const ticketData = { id: ticketSnap.id, ...ticketSnap.data() } as Ticket;

        // Security Check: is the current user the intended recipient?
        if (user && ticketData.endUserId !== user.uid) {
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to view this form.',
            variant: 'destructive',
          });
          setTicket(null);
        } else if (!user) {
            // Unauthenticated users should be redirected from the standalone page
            router.push('/client/login');
            return;
        }
        else {
          setTicket(ticketData);
        }
      } else {
        // Only show toast if it's not the placeholder ID
        if (actualTicketId !== 'some-ticket-id') {
            toast({
              title: 'Not Found',
              description: 'This form could not be found.',
              variant: 'destructive',
            });
        }
        setTicket(null);
      }
      setLoading(false);
    };

    getTicketData();
  }, [user, loadingAuth, params.ticketId, router, toast, actualTicketId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!ticket) return;

    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const formValues: { [key: string]: any } = {};
    formData.forEach((value, key) => {
        formValues[key] = value;
    });

    try {
        const ticketRef = doc(db, 'tickets', ticket.id);
        await updateDoc(ticketRef, {
            status: 'In Progress', // Update status
            formData: formValues, // Save the collected data
            formSubmittedAt: Timestamp.now(), // Track submission time
        });

        toast({
            title: 'Form Submitted',
            description: 'Thank you for providing your information.',
        });
        
        // This causes the component to unmount and the parent can show a "submitted" message
        // In the iframe context, it effectively goes back to the initial state
        setTicket(null);
        setActualTicketId('some-ticket-id'); // Reset for next impersonation

    } catch (error: any) {
        console.error('Error submitting form:', error);
        toast({
            title: 'Submission Failed',
            description: 'An error occurred. Please try again.',
            variant: 'destructive',
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const RootComponent = ({children}: {children: React.ReactNode}) => (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-1 sm:p-4">{children}</div>
  )

  if (loading || loadingAuth) {
    return (
      <RootComponent>
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-1/q" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-24" />
          </CardFooter>
        </Card>
      </RootComponent>
    );
  }

  if (!ticket) {
    return (
      <RootComponent>
        <Card className="w-full max-w-lg text-center">
            <CardHeader>
                <CardTitle>Information Request</CardTitle>
            </CardHeader>
            <CardContent>
                <p>There are no pending forms for this user account.</p>
                <p className="text-sm text-muted-foreground mt-2">If you were just assigned a form, it may take a moment to appear.</p>
            </CardContent>
        </Card>
      </RootComponent>
    );
  }

  return (
    <RootComponent>
      <Card className="w-full max-w-2xl">
        <form onSubmit={handleSubmit}>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Icons.logo className="size-8 text-primary hidden sm:block" />
                <div>
                    <CardTitle className="font-headline text-2xl">
                    Information Request
                    </CardTitle>
                    <CardDescription>
                    Please complete the following form for your {ticket.reportType}.
                    </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
            {ticket.suggestedQuestions && ticket.suggestedQuestions.length > 0 ? (
                ticket.suggestedQuestions.map((question, index) => (
                    <div key={index} className="grid gap-2">
                    <Label htmlFor={`question-${index}`}>{question}</Label>
                    <Textarea id={`question-${index}`} name={question} required disabled={isSubmitting} />
                    </div>
                ))
            ) : (
                <div className="grid gap-2">
                    <Label htmlFor="standard-info">Please provide any relevant details</Label>
                    <Textarea id="standard-info" name="standard-info" required disabled={isSubmitting} />
                </div>
            )}
            </CardContent>
            <CardFooter>
            <Button type="submit" className="bg-accent hover:bg-accent/90" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Form'}
            </Button>
            </CardFooter>
        </form>
      </Card>
    </RootComponent>
  );
}

    