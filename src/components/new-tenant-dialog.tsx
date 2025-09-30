
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
import { useState } from 'react';
import { Textarea } from './ui/textarea';
import { Copy, Mail } from 'lucide-react';
import { Separator } from './ui/separator';
import { auth } from '@/lib/firebase';
import { getIdToken } from 'firebase/auth';
import { sendEmail } from '@/ai/flows/send-email-flow';
import type { SendEmailInput } from '@/ai/schemas/send-email-schema';

interface NewTenantDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onTenantCreated: () => void;
}

export function NewTenantDialog({
  isOpen,
  onOpenChange,
  onTenantCreated,
}: NewTenantDialogProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [companyName, setCompanyName] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  
  const [onboardingLink, setOnboardingLink] = useState('');
  const [emailContent, setEmailContent] = useState<SendEmailInput>({ to: '', subject: '', html: '' });


  const resetForm = () => {
    setStep(1);
    setCompanyName('');
    setCompanyUrl('');
    setAdminName('');
    setAdminEmail('');
    setOnboardingLink('');
    setEmailContent({ to: '', subject: '', html: '' });
  }

  const handleClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  }

  const generateEmailContent = (link: string) => {
      const subject = `Your Invitation to the TenantCheck Platform`;
      const body = `Hello ${adminName},\n\nYou have been invited to become an administrator for ${companyName} on the TenantCheck platform.\n\nPlease use the following secure, single-use link to set up your account and get started:\n\n${link}\n\nThis link will expire after its first use.\n\nWelcome aboard,\nThe TenantCheck Team`;
      setEmailContent({
        to: adminEmail,
        subject: subject,
        html: body,
      });
  }

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            throw new Error("You must be logged in to create a tenant.");
        }
        const token = await getIdToken(currentUser);

        const response = await fetch('/api/tenants', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ companyName, companyUrl, adminName, adminEmail }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to create tenant.');
        }

        toast({
            title: 'Tenant Created',
            description: `"${companyName}" is now in an INVITED state.`,
        });

        const passwordResetLink = data.onboardingLink;
        const actionCode = new URL(passwordResetLink).searchParams.get('oobCode');
        const fullOnboardingUrl = `${window.location.origin}/onboard?oobCode=${actionCode}`;

        setOnboardingLink(fullOnboardingUrl);
        generateEmailContent(fullOnboardingUrl);
        onTenantCreated();
        setStep(2);

    } catch (error: any) {
        toast({
            title: 'Creation Failed',
            description: error.message,
            variant: 'destructive',
        });
    } finally {
        setIsLoading(false);
    }
  };
  
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
            title: 'Invitation Sent',
            description: `An email has been sent to ${emailContent.to}.`,
        });
        handleClose(false);
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
          {step === 1 && (
            <form onSubmit={handleCreateTenant}>
                <DialogHeader>
                <DialogTitle>Create New Tenant</DialogTitle>
                <DialogDescription>
                    This will create a new tenant and a Tenant Admin user. An onboarding link will be generated for the admin.
                </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <h3 className="text-sm font-semibold text-muted-foreground">Company Details</h3>
                    <div className="grid gap-2">
                        <Label htmlFor="company-name">Company Name</Label>
                        <Input id="company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required disabled={isLoading} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="company-url">Company URL (Optional)</Label>
                        <Input id="company-url" value={companyUrl} onChange={(e) => setCompanyUrl(e.target.value)} disabled={isLoading} placeholder="e.g., www.client.com" />
                    </div>
                    <Separator />
                    <h3 className="text-sm font-semibold text-muted-foreground">Tenant Admin Details</h3>
                     <div className="grid gap-2">
                        <Label htmlFor="admin-name">Admin Full Name</Label>
                        <Input id="admin-name" value={adminName} onChange={(e) => setAdminName(e.target.value)} required disabled={isLoading} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="admin-email">Admin Email</Label>
                        <Input id="admin-email" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required disabled={isLoading} />
                    </div>
                </div>
                <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={isLoading}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-accent hover:bg-accent/90">
                    {isLoading ? 'Creating...' : 'Create & Compose Invite'}
                </Button>
                </DialogFooter>
            </form>
          )}

          {step === 2 && (
             <>
                <DialogHeader>
                    <DialogTitle>Compose Onboarding Invitation</DialogTitle>
                    <DialogDescription>
                        Review and send the onboarding email to the new Tenant Admin.
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
                        {/* This will eventually be replaced by a rich text editor */}
                        <Textarea 
                            id="body" 
                            value={emailContent.html} 
                            onChange={(e) => setEmailContent(prev => ({ ...prev, html: e.target.value}))}
                            className="h-64 text-sm" 
                            placeholder="Email body..."
                        />
                     </div>
                     <div className="text-xs text-muted-foreground">
                        The single-use link is included in the email body. You can also{' '}
                        <button type="button" onClick={copyLink} className="underline font-semibold">copy it directly</button>.
                     </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={isLoading}>
                        Send Manually Later
                    </Button>
                    <Button type="button" onClick={handleSendEmail} className="bg-accent hover:bg-accent/90" disabled={isLoading}>
                        <Mail className="mr-2 h-4 w-4" />
                        {isLoading ? 'Sending...' : 'Send Invitation'}
                    </Button>
                </DialogFooter>
            </>
          )}
      </DialogContent>
    </Dialog>
  );
}
