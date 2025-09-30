
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
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type Analyst = {
    uid: string;
    email?: string;
}

type Ticket = {
    id: string;
}

interface AssignTicketDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  ticket: Ticket | null;
  analysts: Analyst[];
}

export function AssignTicketDialog({
  isOpen,
  onOpenChange,
  ticket,
  analysts
}: AssignTicketDialogProps) {
  const [selectedAnalystId, setSelectedAnalystId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAssign = async () => {
    if (!selectedAnalystId || !ticket) {
      toast({
        title: 'Missing Information',
        description: 'Please select an analyst.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    try {
        const ticketRef = doc(db, 'tickets', ticket.id);
        await updateDoc(ticketRef, {
            status: 'In Progress',
            assignedAnalystId: selectedAnalystId,
        });
      
      toast({
        title: 'Ticket Assigned',
        description: `The ticket has been assigned and moved to "In Progress".`,
      });
      onOpenChange(false);
      setSelectedAnalystId('');

    } catch (error: any) {
      toast({
        title: 'Assignment Failed',
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
          <DialogTitle>Assign Ticket</DialogTitle>
          <DialogDescription>
            Choose an analyst to work on this ticket. The status will be automatically updated to "In Progress".
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <Select onValueChange={setSelectedAnalystId} value={selectedAnalystId} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select an analyst" />
              </SelectTrigger>
              <SelectContent>
                {analysts.map(analyst => (
                    <SelectItem key={analyst.uid} value={analyst.uid}>{analyst.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={isLoading} className="bg-accent hover:bg-accent/90">
            {isLoading ? 'Assigning...' : 'Assign Ticket'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    