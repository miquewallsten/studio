
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, Bot, User, X, Loader2 } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { generateText } from '@/lib/ai';
import { sendEmail } from '@/ai/flows/send-email-flow';
import { getAdminDb } from '@/lib/firebase-admin'; // This is a server-side import, will be removed
import admin from 'firebase-admin'; // This is a server-side import, will be removed

interface Message {
    role: 'user' | 'model';
    text: string;
}

export function SupportChatWidget() {
  const [user, loadingAuth] = useAuthState(auth);
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleInitialMessage = () => {
      setIsAiThinking(true);
      const initialMessage = "Hello! How can I help you today with your complaint or suggestion?";
      setHistory([{ role: 'model', text: initialMessage }]);
      setIsAiThinking(false);
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && history.length === 0) {
      handleInitialMessage();
    }
  };
  
  useEffect(() => {
    if (scrollAreaRef.current) {
        const scrollableView = scrollAreaRef.current.querySelector('div');
        if(scrollableView) {
            scrollableView.scrollTop = scrollableView.scrollHeight;
        }
    }
  }, [history]);

  const handleSend = async () => {
    if (!prompt.trim() || !user) return;

    const newUserMessage: Message = { role: 'user', text: prompt };
    const currentHistory = [...history, newUserMessage];
    setHistory(currentHistory);
    const currentPrompt = prompt;
    setPrompt('');
    setIsAiThinking(true);

    try {
        const systemPrompt = `You are a friendly and empathetic support agent for TenantCheck. Your goal is to talk to a user named ${user.displayName} to understand their complaint or suggestion.

        Rules:
        1.  Start by asking clarifying questions to understand the issue fully.
        2.  If it's a complaint, ask about the specific problem, when it occurred, and what the user would like to see as a resolution.
        3.  If it's a suggestion, ask about the idea and how it would improve their experience.
        4.  Maintain a polite and professional tone at all times.
        5.  Once you are confident you have all the necessary details, respond with the special string "SAVE_AND_CLOSE" and NOTHING ELSE. This will trigger the system to save your summary. Do not ask for permission; just use the special string.
        `;
        
        const historyText = currentHistory.map(h => `${h.role}: ${h.text}`).join('\n');
        const fullPrompt = `${systemPrompt}\n\nConversation History:\n${historyText}\nmodel:`;
        
        const response = await generateText(fullPrompt);

        if (response.includes('SAVE_AND_CLOSE')) {
             const finalMessage: Message = { role: 'model', text: "Thank you. Your feedback has been received and a summary has been sent to our executive team. We will be in touch if more information is needed."};
             setHistory(prev => [...prev, finalMessage]);
             
             // The logic to save to Firestore and send email has been removed from here.
             // In a real app, this would trigger a server-side flow.
             toast({
                title: 'Feedback Submitted (Simulated)',
                description: 'Our team has been notified.'
            });

             setTimeout(() => handleOpenChange(false), 5000);
        } else {
             const newModelMessage: Message = { role: 'model', text: response };
             setHistory(prev => [...prev, newModelMessage]);
        }
    } catch (error) {
        console.error("Error in support chat:", error);
        setHistory(prev => [...prev, {role: 'model', text: "I'm sorry, I've encountered an error. Please try again later."}]);
    } finally {
        setIsAiThinking(false);
    }
  }


  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="default"
          className="fixed bottom-4 right-4 rounded-full h-16 w-16 shadow-lg bg-accent hover:bg-accent/90"
        >
          <MessageSquare className="h-8 w-8" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        className="w-[400px] h-[600px] p-0 border-0"
        sideOffset={16}
      >
        <Card className="h-full w-full flex flex-col shadow-2xl">
          <CardHeader className="bg-primary text-primary-foreground">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Support Center</CardTitle>
                <CardDescription className="text-primary-foreground/80">
                  Have a complaint or suggestion? Let us know.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-4">
             <ScrollArea className="h-full" ref={scrollAreaRef}>
                 <div className="space-y-4 pr-4">
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
          <CardFooter className="pt-4 border-t">
             <div className="flex gap-2 w-full">
                <Input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Type your message..."
                    onKeyDown={(e) => e.key === 'Enter' && !isAiThinking && handleSend()}
                    disabled={isAiThinking}
                    />
                <Button onClick={handleSend} disabled={isAiThinking}>
                    {isAiThinking ? <Loader2 className="animate-spin" /> : <Send />}
                </Button>
            </div>
          </CardFooter>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
