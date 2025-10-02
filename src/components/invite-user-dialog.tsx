
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
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Separator } from './ui/separator';
import { useSecureFetch } from '@/hooks/use-secure-fetch';

interface InviteUserDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUserInvited: () => void;
}

export function InviteUserDialog({
  isOpen,
  onOpenChange,
  onUserInvited,
}: InviteUserDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const secureFetch = useSecureFetch();

  const handleInvite = async () => {
    if (!email || !role) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both an email and a role.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    try {
      await secureFetch('/api/users/invite', {
        method: 'POST',
        body: JSON.stringify({ email, role }),
      });
      
      toast({
        title: 'User Invited',
        description: `${email} has been created. They will need to set their password.`,
      });
      onUserInvited();
      onOpenChange(false);
      setEmail('');
      setRole('');

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
            Create a user account. Internal users access the main dashboard, while client-facing users access a specific tenant portal.
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
                <SelectGroup>
                    <SelectLabel>Internal Roles</SelectLabel>
                    <SelectItem value="Super Admin">Super Admin</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Analyst">Analyst</SelectItem>
                    <SelectItem value="View Only">View Only</SelectItem>
                </SelectGroup>
                <Separator />
                <SelectGroup>
                    <SelectLabel>Client-Facing Roles</SelectLabel>
                    <SelectItem value="Tenant Admin">Tenant Admin</SelectItem>
                    <SelectItem value="Tenant User">Tenant User</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={isLoading} className="bg-accent hover:bg-accent/90">
            {isLoading ? 'Creating User...' : 'Create User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
