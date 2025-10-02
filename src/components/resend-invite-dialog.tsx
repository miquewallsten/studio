
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Textarea } from './ui/textarea';
import { Copy, Mail } from 'lucide-react';
import { useSecureFetch } from '@/hooks/use-secure-fetch';
import { sendEmail } from '@/ai/flows/send-email-flow';
import type { SendEmailInput } from '@/ai/schemas/send-email-schema';
import { Skeleton } from './ui/skeleton';

type Tenant = {
    id: string;
    name: string;
}

interface ResendInviteDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  tenant: Tenant | null;
}

export function ResendInviteDialog({
  isOpen,
  onOpenChange,
  tenant,
}: ResendInviteDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [onboardingLink, setOnboardingLink] = useState('');
  const [emailContent, setEmailContent] = useState<SendEmailInput>({ to: '', subject: '', html: '' });
  const secureFetch = useSecureFetch();

  useEffect(() => {
    // When the dialog opens and we have a tenant, fetch the new link.
    if (isOpen && tenant && step === 1) {
        const getNewLink = async () => {
            setIsLoading(true);
            try {
                const data = await secureFetch(`/api/tenants/${tenant.id}/resend-invite`, {
                    method: 'POST',
                });
                
                const passwordResetLink = data.onboardingLink;
                const actionCode = new URL(passwordResetLink).searchParams.get('oobCode');
                const fullOnboardingUrl = `${window.location.origin}/onboard?oobCode=${actionCode}`;

                setOnboardingLink(fullOnboardingUrl);
                
                // Prepare email content
                const subject = `Reminder: Your Invitation to the TenantCheck Platform`;
                const body = `Hello ${data.adminName},\n\nThis is a reminder to set up your administrator account for ${tenant.name} on the TenantCheck platform.\n\nPlease use the following new, secure link to get started:\n\n${fullOnboardingUrl}\n\nThis link will expire after its first use.\n\nWelcome aboard,\nThe TenantCheck Team`;
                setEmailContent({
                    to: data.adminEmail,
                    subject: subject,
                    html: body,
                });

                setStep(2); // Move to composer
            } catch (error: any) {
                 toast({
                    title: 'Failed to Get Link',
                    description: error.message,
                    variant: 'destructive',
                });
                onOpenChange(false); // Close dialog on error
            } finally {
                setIsLoading(false);
            }
        };
        getNewLink();
    } else if (!isOpen) {
        // Reset state when dialog is closed
        setTimeout(() => setStep(1), 300); // Delay to allow animation
        setIsLoading(false);
    }
  }, [isOpen, tenant, toast, onOpenChange, step, secureFetch]);


  const handleSendEmail = async () => {
    setIsLoading(true);
    try {
        const result = await sendEmail({
            to: emailContent.to,
            subject: emailContent.subject,
            html: emailContent.html.replace(/\n/g, '<br>'),
        });
        if (!result.success) {
            throw new Error(result.message);
        }
        toast({
            title: 'Invitation Re-sent',
            description: `A new invitation email has been sent to ${emailContent.to}.`,
        });
        onOpenChange(false);
    } catch(error: any) {
        toast({
            title: 'Email Failed to Send',
            description: error.message || "Please check your SMTP settings in the .env file.",
            variant: 'destructive',
        })
    } finally {
        setIsLoading(false);
    }
  }

  const copyLink = () => {
      navigator.clipboard.writeText(onboardingLink);
      toast({ title: "Copied!", description: "Onboarding link copied to clipboard." });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
          {step === 1 && (
             <>
                <DialogHeader>
                    <DialogTitle>Resending Invitation...</DialogTitle>
                    <DialogDescription>
                        Please wait while we generate a new secure onboarding link for {tenant?.name}.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-8 space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-6 w-2/3" />
                </div>
            </>
          )}
          {step === 2 && (
             <>
                <DialogHeader>
                    <DialogTitle>Compose Onboarding Reminder</DialogTitle>
                    <DialogDescription>
                        Review and resend the onboarding email to the Tenant Admin for {tenant?.name}.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="flex items-center gap-4 rounded-md border p-3">
                        <Label htmlFor="to-email" className="text-muted-foreground">To:</Label>
                        <Input id="to-email" readOnly value={emailContent.to} className="border-0 shadow-none focus-visible:ring-0 p-0" />
                    </div>
                     <div className="flex items-center gap-4 rounded-md border p-3">
                        <Label htmlFor="subject" className="text-muted-foreground">Subject:</Label>
                        <Input 
                            id="subject" 
                            value={emailContent.subject} 
                            onChange={(e) => setEmailContent(prev => ({ ...prev, subject: e.target.value}))} 
                            className="border-0 shadow-none focus-visible:ring-0 p-0 font-medium"
                        />
                     </div>
                     <div className="grid gap-2">
                        <Textarea 
                            id="body" 
                            value={emailContent.html} 
                            onChange={(e) => setEmailContent(prev => ({ ...prev, html: e.target.value}))}
                            className="h-64 text-sm" 
                            placeholder="Email body..."
                        />
                     </div>
                     <div className="text-xs text-muted-foreground">
                        The new single-use link is included in the email body. You can also{' '}
                        <button type="button" onClick={copyLink} className="underline font-semibold">copy it directly</button>.
                     </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleSendEmail} className="bg-accent hover:bg-accent/90" disabled={isLoading}>
                        <Mail className="mr-2 h-4 w-4" />
                        {isLoading ? 'Sending...' : 'Resend Invitation'}
                    </Button>
                </DialogFooter>
            </>
          )}
      </DialogContent>
    </Dialog>
  );
}
