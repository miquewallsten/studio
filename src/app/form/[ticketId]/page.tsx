
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
import { useEffect, useState, useRef, useCallback } from 'react';
import { auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, User, Check, RefreshCcw } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSecureFetch } from '@/hooks/use-secure-fetch';
import type { Timestamp } from 'firebase/firestore';


type Ticket = {
  id: string;
  subjectName: string;
  reportType: string;
  status: string;
  createdAt: string;
  description: string;
  clientEmail: string;
  endUserId: string;
  formId?: string;
  suggestedQuestions?: string[];
  formSubmittedAt?: string;
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
  const secureFetch = useSecureFetch();
  
  const [formMode, setFormMode] = useState<'ai' | 'manual'>('ai');

  // AI Chat state
  const [history, setHistory] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isFormComplete, setIsFormComplete] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Selfie state
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const getTicketData = useCallback(async (userId: string) => {
      setLoading(true);
      try {
        const res = await secureFetch(`/api/tickets/${params.ticketId}`);
        const data = await res.json();
        
        if (data.error) throw new Error(data.error);
        const ticketData = data.ticket as Ticket;

        if (ticketData.endUserId !== userId) {
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to view this form.',
            variant: 'destructive',
          });
          setTicket(null);
        } else if (ticketData.status !== 'New' && ticketData.status !== 'In Progress') {
            setTicket(ticketData); 
        } else {
          let questions = ticketData.suggestedQuestions || [];
          if (ticketData.formId) {
            const formRes = await secureFetch(`/api/forms/${ticketData.formId}`);
            const formData = await formRes.json();
            if (formData.form && formData.form.fields) {
                const fieldIds = formData.form.fields;
                if (fieldIds.length > 0) {
                    const fieldsRes = await secureFetch(`/api/fields?ids=${fieldIds.join(',')}`);
                    const fieldsData = await fieldsRes.json();
                    questions = fieldsData.fields.map((d: any) => d.label);
                }
            }
          }
          const finalTicketData = { ...ticketData, suggestedQuestions: questions };
          setTicket(finalTicketData);
          
          if (history.length === 0 && formMode === 'ai') {
            handleSend(true, finalTicketData);
          }
        }
      } catch (err: any) {
        toast({ title: 'Not Found', description: err.message, variant: 'destructive'});
        setTicket(null);
      } finally {
        setLoading(false);
      }
    }, [params.ticketId, toast, secureFetch, formMode, history.length]);


  useEffect(() => {
    if (loadingAuth) return;

    if (!user) {
        if (authError) {
             router.push('/client/login');
        }
        setLoading(false);
        return;
    }
    
    getTicketData(user.uid);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loadingAuth, authError, getTicketData, router]);

    // Auto-scroll to bottom for chat
  useEffect(() => {
    if (formMode === 'ai' && scrollAreaRef.current) {
        const scrollableView = scrollAreaRef.current.querySelector('div');
        if(scrollableView) {
            scrollableView.scrollTop = scrollableView.scrollHeight;
        }
    }
  }, [history, formMode]);
  
  // Camera permission for selfie
  useEffect(() => {
    if (formMode === 'manual') { // Or wherever the selfie component is rendered
        const getCameraPermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({video: true});
            setHasCameraPermission(true);

            if (videoRef.current) {
            videoRef.current.srcObject = stream;
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
            toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings to use this app.',
            });
        }
        };

        getCameraPermission();
    }
  }, [formMode, toast]);

  const handleSend = async (isFirstMessage = false, currentTicket = ticket) => {
    if (!currentTicket || (!prompt.trim() && !isFirstMessage)) return;

    let currentHistory = history;

    if (!isFirstMessage) {
        const newUserMessage: Message = { role: 'user', text: prompt };
        currentHistory = [...history, newUserMessage];
        setHistory(currentHistory);
        setPrompt('');
    }
    
    setIsAiThinking(true);

    try {
        const systemPrompt = `You are a friendly and professional AI assistant. Your goal is to guide a user named ${user?.displayName || user?.email} through a series of questions to fill out a form.

        Here are the questions you need to ask:
        ${(currentTicket.suggestedQuestions || []).map(q => `- ${q}`).join('\n')}

        Rules:
        1.  Ask only ONE question at a time.
        2.  Start by greeting the user by their name and asking the first question.
        3.  Wait for the user's response before moving to the next question.
        4.  If a user's answer is very short or unclear, you can ask a polite follow-up question like "Could you please provide a bit more detail?".
        5.  Once you have asked all the questions and received answers for them, respond with ONLY the following message, exactly as written: "FORM_COMPLETE". Do not add any other text or explanation before or after this message.
        `;

        const historyText = currentHistory.map(h => `${h.role}: ${h.text}`).join('\n');
        const fullPrompt = `${systemPrompt}\n\nConversation History:\n${historyText}\nmodel:`;
        
        const res = await fetch('/api/ai/echo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: fullPrompt }),
        });
        const json = await res.json();
        const response = json.text ?? '';
        
        if (response.includes('FORM_COMPLETE')) {
            setIsFormComplete(true);
            const finalMessage: Message = { role: 'model', text: "Thank you for providing all the information. Please review your answers and agree to the terms below before submitting."};
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
        await secureFetch(`/api/tickets/${ticket.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
                status: 'In Progress', 
                formData: formValues, 
                formSubmittedAt: new Date().toISOString(),
                eSignature: {
                    agreed: true,
                    timestamp: new Date().toISOString(),
                    ipAddress: '0.0.0.0' // Placeholder
                }
            })
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
            <CardFooter className="flex justify-center">
                <Button variant="outline" onClick={() => router.push('/')}>Return to Login</Button>
            </CardFooter>
        </Card>
      </RootComponent>
    );
  }

  if (ticket.status !== 'New' && ticket.status !== 'In Progress') {
      return (
           <RootComponent>
                <Card className="w-full max-w-lg text-center">
                    <CardHeader>
                        <CardTitle>Form Already Submitted</CardTitle>
                        <CardDescription>
                            This form was submitted on {ticket.formSubmittedAt ? new Date(ticket.formSubmittedAt).toLocaleDateString() : 'a previous date'}.
                        </CardDescription>
                    </CardHeader>
                     <CardContent>
                        <p>No further action is needed.</p>
                     </CardContent>
                     <CardFooter className="flex-col gap-4">
                        <p className="text-xs text-muted-foreground">You can now close this window.</p>
                        <Button variant="outline" onClick={() => router.push('/')}>Return to Login</Button>
                     </CardFooter>
                </Card>
           </RootComponent>
      )
  }
  
  const renderManualForm = () => (
    <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Please fill out all the fields below.</p>
                 {/* This is a placeholder for rendering actual fields */}
                <div className="space-y-4">
                     <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input placeholder="Your full name"/>
                    </div>
                     <div className="space-y-2">
                        <Label>Date of Birth</Label>
                        <Input type="date"/>
                    </div>
                    <div className="space-y-2">
                        <Label>Selfie Verification</Label>
                        <div className="border rounded-lg p-4 space-y-4">
                            <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted />
                            {hasCameraPermission === false && (
                                <Alert variant="destructive">
                                    <AlertTitle>Camera Access Required</AlertTitle>
                                    <AlertDescription>
                                        Please allow camera access to use this feature.
                                    </AlertDescription>
                                </Alert>
                            )}
                            <Button className="w-full" disabled={!hasCameraPermission}>Take Picture</Button>
                        </div>
                    </div>
                </div>
            </div>
        </ScrollArea>
    </CardContent>
  );

  const renderAIForm = () => (
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
  );
  

  return (
    <RootComponent>
      <Card className="w-full max-w-2xl flex flex-col h-[80vh]">
            <CardHeader>
              <div className="flex items-start gap-4">
                <Icons.logo className="size-8 text-primary hidden sm:block" />
                <div className="flex-1">
                    <CardTitle className="font-headline text-2xl">
                    Information Request
                    </CardTitle>
                    <CardDescription>
                    {formMode === 'ai' 
                        ? `An AI assistant will guide you through the questions for your ${ticket.reportType}.`
                        : `Please manually fill out the form for your ${ticket.reportType}.`}
                    </CardDescription>
                </div>
                 <Button variant="outline" size="sm" onClick={() => setFormMode(formMode === 'ai' ? 'manual' : 'ai')}>
                    <RefreshCcw className="mr-2"/>
                     Switch to {formMode === 'ai' ? 'Manual' : 'AI'} Form
                </Button>
              </div>
            </CardHeader>
            {formMode === 'ai' ? renderAIForm() : renderManualForm()}
            <CardFooter className="border-t pt-4">
                {isFormComplete ? (
                    <div className="w-full space-y-4">
                        <div className="items-top flex space-x-2">
                            <Checkbox id="terms1" checked={isAgreed} onCheckedChange={(checked) => setIsAgreed(checked as boolean)} />
                            <div className="grid gap-1.5 leading-none">
                                <label
                                htmlFor="terms1"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                Electronic Signature Agreement
                                </label>
                                <p className="text-sm text-muted-foreground">
                                I declare under penalty of perjury that the information provided is true and correct. I understand this constitutes a legal electronic signature.
                                </p>
                            </div>
                        </div>
                        <Button onClick={handleSubmit} disabled={isSubmitting || !isAgreed} className="w-full bg-accent hover:bg-accent/90">
                            {isSubmitting ? 'Submitting...' : 'Sign and Submit Form'}
                        </Button>
                    </div>
                ) : (
                    <div className="flex gap-2 w-full">
                        <Input
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Type your answer here..."
                            onKeyDown={(e) => e.key === 'Enter' && !isAiThinking && handleSend()}
                            disabled={isAiThinking || formMode === 'manual'}
                            />
                        <Button onClick={() => handleSend()} disabled={isAiThinking || formMode === 'manual'}>
                            <Send />
                        </Button>
                    </div>
                )}
            </CardFooter>
      </Card>
    </RootComponent>
  );
}
