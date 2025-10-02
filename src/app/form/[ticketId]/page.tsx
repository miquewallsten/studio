
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
import { useEffect, useState, useRef } from 'react';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { conversationalForm } from '@/ai/flows/conversational-form-flow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';


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

type Message = {
    role: 'user' | 'model';
    text: string;
}

export default function FormPage({ params }: { params: { ticketId: string }}) {
  const [user, loadingAuth, authError] = useAuthState(auth);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const [history, setHistory] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isFormComplete, setIsFormComplete] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (loadingAuth) return;

    if (!user) {
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
             setTicket(ticketData); 
        }
        else {
          setTicket(ticketData);
          // Kick off the conversation
          if (history.length === 0) {
            handleSend(true);
          }
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loadingAuth, authError, params.ticketId, router, toast]);

    // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
        const scrollableView = scrollAreaRef.current.querySelector('div');
        if(scrollableView) {
            scrollableView.scrollTop = scrollableView.scrollHeight;
        }
    }
  }, [history]);
  
  const handleSend = async (isFirstMessage = false) => {
    if (!ticket || (!prompt.trim() && !isFirstMessage)) return;

    let currentHistory = history;

    if (!isFirstMessage) {
        const newUserMessage: Message = { role: 'user', text: prompt };
        currentHistory = [...history, newUserMessage];
        setHistory(currentHistory);
        setPrompt('');
    }
    
    setIsAiThinking(true);

    try {
        const genkitHistory = currentHistory.map(h => ({
            role: h.role,
            content: [{text: h.text}]
        }));

        const response = await conversationalForm({
            history: genkitHistory,
            questions: ticket.suggestedQuestions || [],
            userName: user?.displayName || user?.email || 'user',
        });
        
        if (response.includes('FORM_COMPLETE')) {
            setIsFormComplete(true);
            const finalMessage: Message = { role: 'model', text: "Thank you for providing all the information. Please review your answers in the chat history. If everything is correct, click the 'Submit Form' button below."};
            setHistory(prev => [...prev, finalMessage]);
        } else {
            const newModelMessage: Message = { role: 'model', text: response };
            setHistory(prev => [...prev, newModelMessage]);
        }
    } catch (error) {
        console.error("Error calling conversational AI:", error);
        const errorMessage: Message = { role: 'model', text: "Sorry, I encountered an error. Please try again." };
        setHistory(prev => [...prev, errorMessage]);
    } finally {
        setIsAiThinking(false);
    }
  };


  const handleSubmit = async () => {
    if (!ticket) return;

    setIsSubmitting(true);
    
    const formValues: { [key: string]: any } = {};
    const questions = ticket.suggestedQuestions || [];
    let questionIndex = 0;

    // A simple heuristic to parse answers from the conversation history
    history.forEach(msg => {
        if(msg.role === 'user' && questionIndex < questions.length) {
            formValues[questions[questionIndex]] = msg.text;
            questionIndex++;
        }
    });

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
          <CardHeader> <Skeleton className="h-8 w-3/4" /> <Skeleton className="h-4 w-1/2" /> </CardHeader>
          <CardContent> <Skeleton className="h-40 w-full" /> </CardContent>
          <CardFooter> <Skeleton className="h-10 w-24" /> </CardFooter>
        </Card>
      </RootComponent>
    );
  }

  if (!ticket || !user) {
    return (
      <RootComponent>
        <Card className="w-full max-w-lg text-center">
            <CardHeader> <CardTitle>Information Request</CardTitle> </CardHeader>
            <CardContent> <p>There are no pending forms for this user account.</p> <p className="text-sm text-muted-foreground mt-2">Please check the link from your email or contact the requester.</p> </CardContent>
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
  

  return (
    <RootComponent>
      <Card className="w-full max-w-2xl flex flex-col h-[80vh]">
            <CardHeader>
              <div className="flex items-center gap-4">
                <Icons.logo className="size-8 text-primary hidden sm:block" />
                <div>
                    <CardTitle className="font-headline text-2xl">
                    Information Request
                    </CardTitle>
                    <CardDescription>
                    An AI assistant will guide you through the questions for your {ticket.reportType}.
                    </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
                <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
                    <div className="space-y-4">
                        {history.map((msg, index) => (
                            <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                {msg.role === 'model' && <Avatar className="w-8 h-8"><AvatarFallback><Bot className="w-5 h-5"/></AvatarFallback></Avatar>}
                                <div className={`px-4 py-2 rounded-lg max-w-[80%] ${msg.role === 'model' ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                </div>
                                {msg.role === 'user' && <Avatar className="w-8 h-8"><AvatarFallback><User className="w-5 h-5"/></AvatarFallback></Avatar>}
                            </div>
                        ))}
                         {isAiThinking && (
                            <div className="flex items-start gap-3">
                                <Avatar className="w-8 h-8"><AvatarFallback><Bot className="w-5 h-5"/></AvatarFallback></Avatar>
                                <div className="px-4 py-2 rounded-lg bg-muted flex items-center">
                                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse [animation-delay:-0.15s] mx-1"></div>
                                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

            </CardContent>
            <CardFooter className="border-t pt-4">
                {isFormComplete ? (
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-accent hover:bg-accent/90">
                        {isSubmitting ? 'Submitting...' : 'Submit Form'}
                    </Button>
                ) : (
                    <div className="flex gap-2 w-full">
                        <Input
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Type your answer here..."
                            onKeyDown={(e) => e.key === 'Enter' && !isAiThinking && handleSend()}
                            disabled={isAiThinking}
                            />
                        <Button onClick={() => handleSend()} disabled={isAiThinking}>
                            <Send />
                        </Button>
                    </div>
                )}
            </CardFooter>
      </Card>
    </RootComponent>
  );
}
