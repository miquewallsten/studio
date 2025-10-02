
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Building, Ticket, Bot, Zap, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

type Action = 'createTenant' | 'createTicket' | null;

export function QuickActionsWidget() {
  const [activeAction, setActiveAction] = useState<Action>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const { toast } = useToast();
  const { locale, t } = useLanguage();

  const handleAction = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setResult('');
    
    const formData = new FormData(event.currentTarget);
    let prompt = '';

    if (activeAction === 'createTenant') {
      const name = formData.get('tenant-name') as string;
      prompt = `Create a new tenant named "${name}"`;
    } else if (activeAction === 'createTicket') {
      const subjectName = formData.get('subject-name') as string;
      const subjectEmail = formData.get('email') as string;
      const reportType = formData.get('report-type') as string;
      const description = formData.get('description') as string;
      prompt = `Create a new ticket for ${subjectName} with email ${subjectEmail} for a ${reportType}. Notes: ${description}`;
    }

    try {
        const systemPrompt = `You are a helpful AI assistant for a Super Admin. Your purpose is to assist the admin by performing actions on their behalf. You MUST respond in the user's language. The user's current language is: ${locale}.`;
        const fullPrompt = `${systemPrompt}\n\nuser: ${prompt}\nmodel:`;
        
        const res = await fetch('/api/ai/echo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: fullPrompt }),
        });
        const json = await res.json();
        const response = json.text ?? '';

      setResult(response);
      toast({
        title: 'Action Successful',
        description: 'The AI assistant has completed the task.',
      });
    } catch (error: any) {
      console.error('AI action failed:', error);
      setResult(`Error: ${error.message}`);
      toast({
        title: 'Action Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setActiveAction(null);
    setResult('');
    setIsLoading(false);
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
    }
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="non-draggable">
          <CardTitle className="flex items-center gap-2">
            <Zap className="text-accent" />
            Quick Actions
          </CardTitle>
          <CardDescription>Use AI to perform common tasks.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center non-draggable">
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" size="lg" className="h-20" onClick={() => setActiveAction('createTenant')}>
              <Building className="mr-2" />
              New Tenant
            </Button>
            <Button variant="outline" size="lg" className="h-20" onClick={() => setActiveAction('createTicket')}>
              <Ticket className="mr-2" />
              New Ticket
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!activeAction} onOpenChange={handleOpenChange}>
        <DialogContent>
          <form onSubmit={handleAction}>
            {activeAction === 'createTenant' && (
              <>
                <DialogHeader>
                  <DialogTitle>Create New Tenant</DialogTitle>
                  <DialogDescription>
                    The AI will create a new tenant company in Firestore.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Label htmlFor="tenant-name">Tenant Name</Label>
                  <Input id="tenant-name" name="tenant-name" required disabled={isLoading} />
                </div>
              </>
            )}

            {activeAction === 'createTicket' && (
              <>
                <DialogHeader>
                  <DialogTitle>Create New Ticket</DialogTitle>
                  <DialogDescription>
                    The AI will create a new investigation ticket.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="subject-name">Subject Name</Label>
                    <Input id="subject-name" name="subject-name" required disabled={isLoading} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Subject's Email</Label>
                    <Input id="email" name="email" type="email" required disabled={isLoading} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="report-type">Report Type</Label>
                    <Select name="report-type" required disabled={isLoading} defaultValue="background-check">
                      <SelectTrigger id="report-type">
                        <SelectValue placeholder="Select a report type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="background-check">Background Check</SelectItem>
                        <SelectItem value="tenant-screening">Tenant Screening</SelectItem>
                        <SelectItem value="employment-verification">Employment Verification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Notes</Label>
                    <Textarea id="description" name="description" placeholder="Optional notes for the analyst." disabled={isLoading} />
                  </div>
                </div>
              </>
            )}

            {result && (
              <div className="mt-4 rounded-md border bg-muted p-4">
                <div className="flex items-start gap-3">
                    <Bot className="flex-shrink-0 mt-1" />
                    <div className="flex-1">
                        <p className="font-semibold">AI Assistant Response</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{result}</p>
                    </div>
                </div>
              </div>
            )}

            <DialogFooter className="pt-4">
                <Button type="button" variant="ghost" onClick={reset}>Close</Button>
                <Button type="submit" disabled={isLoading} className="bg-accent hover:bg-accent/90">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2"/>}
                {isLoading ? 'Executing...' : 'Run Action'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
