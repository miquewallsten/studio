
'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, User } from 'lucide-react';
import { chat } from '@/ai/flows/assistant-flow';
import { useLanguage } from '@/contexts/language-context';

interface Message {
    role: 'user' | 'model';
    text: string;
}

export function AssistantWidget() {
    const [history, setHistory] = useState<Message[]>([]);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const { locale, t } = useLanguage();

    const handleSend = async () => {
        if (!prompt.trim()) return;

        const newUserMessage: Message = { role: 'user', text: prompt };
        setHistory(prev => [...prev, newUserMessage]);
        setPrompt('');
        setIsLoading(true);

        try {
            const response = await chat({
                history: history.map(h => ({
                    role: h.role,
                    content: [{text: h.text}]
                })),
                prompt,
                locale,
            });
            const newModelMessage: Message = { role: 'model', text: response };
            setHistory(prev => [...prev, newModelMessage]);
        } catch (error) {
            console.error("Error calling AI assistant:", error);
            const errorMessage: Message = { role: 'model', text: "Sorry, I encountered an error. Please try again." };
            setHistory(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollableView = scrollAreaRef.current.querySelector('div');
            if(scrollableView) {
                scrollableView.scrollTop = scrollableView.scrollHeight;
            }
        }
    }, [history]);

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="non-draggable">
                <div className="flex items-center gap-2">
                    <Bot className="text-accent" />
                    <div>
                        <CardTitle>{t('dashboard.ai_assistant.title')}</CardTitle>
                        <CardDescription>{t('dashboard.ai_assistant.description')}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
                <ScrollArea className="flex-1 pr-4 non-draggable" ref={scrollAreaRef}>
                    <div className="space-y-4">
                        {history.map((msg, index) => (
                            <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                {msg.role === 'model' && <Bot className="flex-shrink-0" />}
                                <div className={`px-4 py-2 rounded-lg max-w-[80%] ${msg.role === 'model' ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                </div>
                                {msg.role === 'user' && <User className="flex-shrink-0" />}
                            </div>
                        ))}
                         {isLoading && (
                            <div className="flex items-start gap-3">
                                <Bot className="flex-shrink-0 animate-pulse" />
                                <div className="px-4 py-2 rounded-lg bg-muted">
                                    <p className="text-sm">{t('common.loading')}...</p>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <div className="flex gap-2 non-draggable">
                    <Input
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={t('dashboard.ai_assistant.placeholder')}
                        onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                        disabled={isLoading}
                    />
                    <Button onClick={handleSend} disabled={isLoading}>
                        <Send />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
