
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

type User = {
    uid: string;
    role: string;
}

interface ChangeRoleDialogProps {
  user: User | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onRoleChanged: () => void;
}

export function ChangeRoleDialog({
  user,
  isOpen,
  onOpenChange,
  onRoleChanged,
}: ChangeRoleDialogProps) {
  const [newRole, setNewRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleRoleChange = async () => {
    if (!newRole || !user) {
      toast({
        title: 'Missing Information',
        description: 'Please select a new role.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${user.uid}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change role.');
      }
      
      toast({
        title: 'Role Updated',
        description: `The user's role has been changed to ${newRole}.`,
      });
      onRoleChanged();
      onOpenChange(false);
      setNewRole('');

    } catch (error: any) {
      toast({
        title: 'Update Failed',
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
          <DialogTitle>Change User Role</DialogTitle>
          <DialogDescription>
            Select a new role for the user. This will change their permissions across the application.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <Select onValueChange={setNewRole} defaultValue={user?.role} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select a new role" />
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
                     <SelectItem value="End User">End User</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleRoleChange} disabled={isLoading} className="bg-accent hover:bg-accent/90">
            {isLoading ? 'Saving...' : 'Save New Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
