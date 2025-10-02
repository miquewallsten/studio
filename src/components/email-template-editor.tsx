
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Copy } from 'lucide-react';
import { sendEmail } from '@/ai/flows/send-email-flow';

type Template = {
    id: string;
    name: string;
    subject: string;
    body: string;
    placeholders: string[];
};

interface EmailTemplateEditorProps {
    template: Template;
}

export function EmailTemplateEditor({ template: initialTemplate }: EmailTemplateEditorProps) {
  const [template, setTemplate] = useState<Template>(initialTemplate);
  const [isSaving, setIsSaving] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setTemplate(initialTemplate);
  }, [initialTemplate]);

 const handleSave = async () => {
    if (!template) return;
    setIsSaving(true);
    try {
        const templateRef = doc(db, 'email_templates', template.id);
        await updateDoc(templateRef, {
            subject: template.subject,
            body: template.body,
        });
        toast({
            title: 'Template Saved',
            description: 'Your changes have been saved successfully.',
        });
    } catch (error) {
        console.error("Error saving template: ", error);
        toast({
            title: 'Error',
            description: 'Failed to save template changes. Please try again.',
            variant: 'destructive'
        });
    } finally {
        setIsSaving(false);
    }
  }

  const copyPlaceholder = (placeholder: string) => {
    navigator.clipboard.writeText(placeholder);
    toast({
        description: `"${placeholder}" copied to clipboard.`
    })
  }

  const sendTestEmail = async () => {
      if (!testEmail) {
          toast({ title: 'Error', description: 'Please enter a recipient email.', variant: 'destructive'});
          return;
      }
      setIsSendingTest(true);
      try {
          // Replace placeholders with sample data for the test
          let testBody = template.body;
          template.placeholders.forEach(ph => {
              const sampleData = `[Sample ${ph.replace(/{{|}}/g, '')}]`;
              testBody = testBody.replace(new RegExp(ph, 'g'), sampleData);
          });

          const result = await sendEmail({
              to: testEmail,
              subject: `[TEST] ${template.subject}`,
              html: testBody.replace(/\n/g, '<br />'),
          });
          if (!result.success) throw new Error(result.message);
          toast({
              title: 'Test Email Sent',
              description: `A test email has been sent to ${testEmail}.`
          });
      } catch (error: any) {
          toast({
              title: 'Failed to Send Test Email',
              description: error.message,
              variant: 'destructive'
          })
      } finally {
        setIsSendingTest(false);
      }
  }

  if (!template) {
    return null;
  }

  return (
    <div className="space-y-4">
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-2xl font-semibold font-headline">
                            Edit: {template.name}
                        </CardTitle>
                        <CardDescription>
                            Modify the subject and body for this email template.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="template-subject">Subject</Label>
                    <Input 
                        id="template-subject"
                        value={template.subject}
                        onChange={(e) => setTemplate(t => ({...t, subject: e.target.value}))}
                        className="text-base font-medium"
                    />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="template-body">Body</Label>
                    <Textarea
                        id="template-body"
                        value={template.body}
                        onChange={(e) => setTemplate(t => ({...t, body: e.target.value}))}
                        className="min-h-80"
                    />
                </div>
            </CardContent>
            <CardFooter className="justify-end gap-2">
                <Button variant="outline" onClick={() => setTemplate(initialTemplate)}>Reset Changes</Button>
                <Button onClick={handleSave} className="bg-accent hover:bg-accent/90" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Template'}
                </Button>
            </CardFooter>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Available Placeholders</CardTitle>
                <CardDescription>Click to copy a placeholder to your clipboard.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
                {template.placeholders.map(ph => (
                    <Badge 
                        key={ph} 
                        variant="outline" 
                        onClick={() => copyPlaceholder(ph)}
                        className="cursor-pointer hover:bg-muted"
                    >
                       <Copy className="size-3 mr-2" /> {ph}
                    </Badge>
                ))}
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Send Test Email</CardTitle>
                <CardDescription>Send a rendered version of this template to an email address of your choice.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
                <Input 
                    type="email" 
                    placeholder="recipient@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    disabled={isSendingTest}
                />
                 <Button onClick={sendTestEmail} disabled={isSendingTest}>
                    {isSendingTest ? 'Sending...' : 'Send Test'}
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
