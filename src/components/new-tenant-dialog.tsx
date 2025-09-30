
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
import { Copy } from 'lucide-react';
import { Separator } from './ui/separator';

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
  const [adminPhone, setAdminPhone] = useState('');
  
  const [onboardingLink, setOnboardingLink] = useState('');

  const resetForm = () => {
    setStep(1);
    setCompanyName('');
    setCompanyUrl('');
    setAdminName('');
    setAdminEmail('');
    setAdminPhone('');
    setOnboardingLink('');
  }

  const handleClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  }

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
        const response = await fetch('/api/tenants', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyName, companyUrl, adminName, adminEmail, adminPhone }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to create tenant.');
        }

        toast({
            title: 'Tenant Created',
            description: `"${companyName}" is now in an INVITED state.`,
        });

        setOnboardingLink(data.onboardingLink);
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
  
  const copyLink = () => {
      navigator.clipboard.writeText(onboardingLink);
      toast({ title: "Copied!", description: "Onboarding link copied to clipboard." });
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
          {step === 1 && (
            <form onSubmit={handleNext}>
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
                        <Label htmlFor="company-url">Company URL</Label>
                        <Input id="company-url" value={companyUrl} onChange={(e) => setCompanyUrl(e.target.value)} disabled={isLoading} />
                    </div>
                    <Separator />
                    <h3 className="text-sm font-semibold text-muted-foreground">Tenant Admin Details</h3>
                     <div className="grid gap-2">
                        <Label htmlFor="admin-name">Admin Name</Label>
                        <Input id="admin-name" value={adminName} onChange={(e) => setAdminName(e.target.value)} required disabled={isLoading} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="admin-email">Admin Email</Label>
                        <Input id="admin-email" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required disabled={isLoading} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="admin-phone">Admin Phone</Label>
                        <Input id="admin-phone" type="tel" value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)} disabled={isLoading} />
                    </div>
                </div>
                <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={isLoading}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-accent hover:bg-accent/90">
                    {isLoading ? 'Creating...' : 'Next'}
                </Button>
                </DialogFooter>
            </form>
          )}

          {step === 2 && (
             <>
                <DialogHeader>
                    <DialogTitle>Onboarding Link Generated</DialogTitle>
                    <DialogDescription>
                        Send this single-use link to the Tenant Admin to complete their account setup.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                        This link will allow <span className="font-semibold">{adminName}</span> to set their password and finish onboarding for <span className="font-semibold">{companyName}</span>.
                    </p>
                    <div className="flex items-center space-x-2">
                        <Textarea readOnly value={onboardingLink} className="text-xs h-24" />
                        <Button type="button" size="icon" variant="outline" onClick={copyLink}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                    <p className="text-xs text-destructive">
                        For security, this link will only be shown once. Please copy it now.
                    </p>
                </div>
                <DialogFooter>
                    {/* The email composer will be added here in a future step */}
                    <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                        Done
                    </Button>
                </DialogFooter>
            </>
          )}
      </DialogContent>
    </Dialog>
  );
}
