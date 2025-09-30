
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
import { doc, onSnapshot, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
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

export default function FormPage({ params }: { params: { ticketId: string } }) {
  const [user, loadingAuth] = useAuthState(auth);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (loadingAuth) return;
    if (!user) {
      router.push('/client/login'); // Or a dedicated end-user login
      return;
    }

    const getTicketData = async () => {
      const ticketRef = doc(db, 'tickets', params.ticketId);
      const ticketSnap = await getDoc(ticketRef);

      if (ticketSnap.exists()) {
        const ticketData = { id: ticketSnap.id, ...ticketSnap.data() } as Ticket;

        // Security Check: Ensure the logged-in user is the intended end-user for this ticket
        if (ticketData.endUserId !== user.uid) {
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to view this form.',
            variant: 'destructive',
          });
          setTicket(null);
        } else {
          setTicket(ticketData);
        }
      } else {
        toast({
          title: 'Not Found',
          description: 'This form could not be found.',
          variant: 'destructive',
        });
      }
      setLoading(false);
    };

    getTicketData();
  }, [user, loadingAuth, params.ticketId, router, toast]);

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

        router.push(`/form/submitted`);

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

  if (loading || loadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
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
                <Skeleton className="h-4 w-1/4" />
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
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <Card className="w-full max-w-lg">
            <CardHeader>
                <CardTitle>Error</CardTitle>
            </CardHeader>
            <CardContent>
                <p>This form is unavailable or you don't have permission to access it.</p>
                <Button asChild className="mt-4">
                    <Link href="/client/login">Return to Login</Link>
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
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
    </div>
  );
}
