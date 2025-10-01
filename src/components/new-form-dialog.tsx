
'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';

interface NewFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onFormCreated: () => void;
}

export function NewFormDialog({ isOpen, onOpenChange, onFormCreated }: NewFormDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setIsLoading(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    if (!formName) {
      toast({
        title: 'Error',
        description: 'Form Name is required.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    try {
      await addDoc(collection(db, 'forms'), {
        name: formName,
        description: formDescription,
        createdAt: serverTimestamp(),
      });

      toast({
        title: 'Form Template Created',
        description: `The "${formName}" template has been saved.`,
      });

      onFormCreated();
      handleOpenChange(false);

    } catch (error) {
      console.error('Error creating form template:', error);
      toast({
        title: 'Error',
        description: 'Failed to create form template. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Form Template</DialogTitle>
            <DialogDescription>
              Define the name and description for your new form template. You can add fields after creating it.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="form-name">Form Name</Label>
              <Input
                id="form-name"
                name="form-name"
                required
                disabled={isLoading}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="form-description">Description</Label>
              <Textarea
                id="form-description"
                name="form-description"
                placeholder="A brief description of what this form is for."
                disabled={isLoading}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>Cancel</Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Form Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
