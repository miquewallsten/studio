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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useAuthRole } from '@/hooks/use-auth-role';
import { getIdToken } from 'firebase/auth';

interface TenantInviteUserDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUserInvited: () => void;
}

export function TenantInviteUserDialog({
  isOpen,
  onOpenChange,
  onUserInvited,
}: TenantInviteUserDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('End User'); // Default to End User for tenants
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user: tenantAdminUser } = useAuthRole();

  const handleInvite = async () => {
    if (!email || !role) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both an email and a role.',
        variant: 'destructive',
      });
      return;
    }

    if (!tenantAdminUser) {
        toast({ title: 'Error', description: 'Could not identify the current tenant.', variant: 'destructive'});
        return;
    }
    
    // Get tenantId from the currently logged in Tenant Admin
    const idTokenResult = await tenantAdminUser.getIdTokenResult();
    const tenantId = idTokenResult.claims.tenantId;

    if (!tenantId) {
         toast({ title: 'Error', description: 'Your account is not associated with a tenant.', variant: 'destructive'});
        return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role, tenantId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to invite user.');
      }
      
      toast({
        title: 'User Invited',
        description: `${email} has been added to your organization. They will receive an email to set up their account.`,
      });
      onUserInvited();
      onOpenChange(false);
      setEmail('');
      setRole('End User');

    } catch (error: any) {
      toast({
        title: 'Invitation Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite New User</DialogTitle>
          <DialogDescription>
            Invite a new user to your organization. They will be able to submit forms on behalf of your company.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3"
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <Select onValueChange={setRole} value={role} disabled={isLoading}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                 <SelectItem value="End User">End User (Can fill forms)</SelectItem>
                 <SelectItem value="Tenant Admin">Tenant Admin (Can manage users)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={isLoading} className="bg-accent hover:bg-accent/90">
            {isLoading ? 'Inviting User...' : 'Invite User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
