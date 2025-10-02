

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
import { useEffect, useState, useRef } from 'react';
import { doc, getDoc, updateDoc, Timestamp, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

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
  formSubmittedAt?: Timestamp;
};

export default function FormPage({ params }: { params: { ticketId: string }}) {
  const [user, loadingAuth, authError] = useAuthState(auth);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);

  useEffect(() => {
    const getCameraPermission = async () => {
      if (hasCameraPermission === null) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({video: true});
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
        }
      }
    };
    getCameraPermission();
  }, [hasCameraPermission]);

  useEffect(() => {
    if (loadingAuth) return;

    if (!user) {
        // If there's no user, it's likely they just set their password.
        // The auth state might not have updated yet. We don't want to redirect immediately.
        // A better UX would be to show a loading/spinner state until auth resolves.
        // If authError is present, then we can redirect.
        if (authError) {
             router.push('/client/login');
        }
        setLoading(false);
        return;
    }
    
    const getTicketData = async () => {
      setLoading(true);
      const ticketRef = doc(db, 'tickets', params.ticketId);
      const ticketSnap = await getDoc(ticketRef);

      if (ticketSnap.exists()) {
        const ticketData = { id: ticketSnap.id, ...ticketSnap.data() } as Ticket;

        if (ticketData.endUserId !== user.uid) {
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to view this form.',
            variant: 'destructive',
          });
          setTicket(null);
        } else if (ticketData.status !== 'New') {
             setTicket(ticketData); // Still show the ticket, but it will be read-only
        }
        else {
          setTicket(ticketData);
        }
      } else {
        toast({
          title: 'Not Found',
          description: 'This form could not be found or has already been submitted.',
          variant: 'destructive',
        });
        setTicket(null);
      }
      setLoading(false);
    };

    getTicketData();
  }, [user, loadingAuth, authError, params.ticketId, router, toast]);

  const handleCaptureSelfie = () => {
    if (videoRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg');
            setSelfie(dataUrl);
        }
    }
  };


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!ticket) return;

    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const formValues: { [key: string]: any } = {};
    formData.forEach((value, key) => {
        formValues[key] = value;
    });

    if (selfie) {
        formValues['selfie'] = selfie;
    }

    try {
        const ticketRef = doc(db, 'tickets', ticket.id);
        await updateDoc(ticketRef, {
            status: 'In Progress', 
            formData: formValues, 
            formSubmittedAt: Timestamp.now(),
        });

        toast({
            title: 'Form Submitted',
            description: 'Thank you for providing your information.',
        });
        
        router.push('/form/submitted');

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

  if (!ticket || !user) {
    return (
      <RootComponent>
        <Card className="w-full max-w-lg text-center">
            <CardHeader>
                <CardTitle>Information Request</CardTitle>
            </CardHeader>
            <CardContent>
                <p>There are no pending forms for this user account.</p>
                <p className="text-sm text-muted-foreground mt-2">Please check the link from your email or contact the requester.</p>
            </CardContent>
        </Card>
      </RootComponent>
    );
  }

  if (ticket.status !== 'New') {
      return (
           <RootComponent>
                <Card className="w-full max-w-lg text-center">
                    <CardHeader>
                        <CardTitle>Form Already Submitted</CardTitle>
                        <CardDescription>
                            This form was submitted on {ticket.formSubmittedAt ? new Date(ticket.formSubmittedAt.toDate()).toLocaleDateString() : 'a previous date'}. No further action is needed.
                        </CardDescription>
                    </CardHeader>
                </Card>
           </RootComponent>
      )
  }
  
  const hasSelfieQuestion = ticket.suggestedQuestions?.some(q => q.toLowerCase().includes('selfie'));

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
            {ticket.suggestedQuestions?.filter(q => !q.toLowerCase().includes('selfie')).map((question, index) => (
                <div key={index} className="grid gap-2">
                    <Label htmlFor={`question-${index}`}>{question}</Label>
                    <Textarea id={`question-${index}`} name={question} required disabled={isSubmitting} />
                </div>
            ))}
            
            {hasSelfieQuestion && (
                <div className="space-y-4 rounded-lg border p-4">
                    <Label>Selfie Verification</Label>
                    <div className="w-full aspect-video bg-black rounded-md flex items-center justify-center relative">
                        <video ref={videoRef} className={`w-full aspect-video rounded-md ${selfie ? 'hidden' : ''}`} autoPlay muted playsInline />
                        {selfie && <img src={selfie} alt="Your selfie" className="w-full aspect-video rounded-md object-cover" />}
                        {hasCameraPermission === false && (
                            <Alert variant="destructive" className="absolute">
                                <AlertTitle>Camera Access Required</AlertTitle>
                                <AlertDescription>
                                    Please allow camera access to use this feature.
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                    {selfie ? (
                        <Button variant="outline" onClick={() => setSelfie(null)} className="w-full">
                            Retake Selfie
                        </Button>
                    ) : (
                         <Button type="button" onClick={handleCaptureSelfie} disabled={!hasCameraPermission || isSubmitting} className="w-full">
                            Capture Selfie
                        </Button>
                    )}
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
