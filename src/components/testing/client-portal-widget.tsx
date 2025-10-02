
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, User, ExternalLink } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, onSnapshot, query, where, Timestamp, addDoc, serverTimestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { suggestComplianceQuestions } from '@/ai/flows/compliance-question-suggestions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '../ui/dropdown-menu';

type User = {
    uid: string;
    email?: string;
}

interface ClientPortalWidgetProps {
    users: User[];
    onImpersonate: (uid: string, email?: string) => void;
    onUserCreated: () => void;
    isImpersonating: boolean;
}

export function ClientPortalWidget({ users, onImpersonate, onUserCreated, isImpersonating }: ClientPortalWidgetProps) {
  const [user, loadingAuth] = useAuthState(auth);
  const [isRequestDialogOpen, setRequestDialogOpen] = useState(false);
  const [iframeKey, setIframeKey] = useState(Date.now());

  useEffect(() => {
    // When the user changes, force the iframe to re-render to reflect the new auth state
    setIframeKey(Date.now());
  }, [user]);

  const isClient = !!(user?.stsTokenManager as any)?.claims?.tenantId;
  
  return (
    <Card className="h-full flex flex-col">
        <NewRequestDialog 
            isOpen={isRequestDialogOpen}
            onOpenChange={setRequestDialogOpen}
            onUserCreated={onUserCreated}
            clientUser={user}
        />
        <CardHeader className="non-draggable">
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                    <CardTitle>Client Portal</CardTitle>
                    <CardDescription>
                        Impersonate a client to test their dashboard and create requests.
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <User className="mr-2"/>
                                {user && isClient ? user.email : "Impersonate Client"}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56">
                            <DropdownMenuLabel>Select a Client</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {users.map(u => (
                                <DropdownMenuItem key={u.uid} onClick={() => onImpersonate(u.uid, u.email)} disabled={isImpersonating}>
                                    {u.email}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {isClient && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => setRequestDialogOpen(true)}>
                            <PlusCircle className="mr-2" />
                            New Request
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                            <a href="/client/dashboard" target="_blank" rel="noopener noreferrer">
                                <ExternalLink />
                            </a>
                        </Button>
                      </>
                    )}
                </div>
            </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0 m-2 border rounded-lg">
            {loadingAuth ? (
                <div className="h-full flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Loading user data...</p>
                </div>
            ) : !isClient ? (
                <div className="h-full flex items-center justify-center p-4">
                    <p className="text-sm text-muted-foreground text-center">Select a client user to impersonate to see their live portal.</p>
                </div>
            ) : (
               <iframe key={iframeKey} src="/client/dashboard" className="w-full h-full border-0" />
            )}
        </CardContent>
    </Card>
  );
}

function NewRequestDialog({ isOpen, onOpenChange, onUserCreated, clientUser }: { isOpen: boolean; onOpenChange: (open: boolean) => void; onUserCreated: () => void, clientUser: any }) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
  
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsLoading(true);
      const formData = new FormData(event.currentTarget);
      const subjectName = formData.get('subject-name') as string;
      const email = formData.get('email') as string;
      const reportType = formData.get('report-type') as string;
      const description = formData.get('description') as string;
  
      if (!clientUser) {
          toast({
              title: 'Error',
              description: 'You must be impersonating a client to create a request.',
              variant: 'destructive',
          });
          setIsLoading(false);
          return;
      }
  
      try {
        const inviteResponse = await fetch('/api/users/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, tenantId: clientUser.uid }), 
        });
  
        const inviteData = await inviteResponse.json();
        
        if (!inviteResponse.ok && !inviteData.error?.includes('already exists')) {
          throw new Error(inviteData.error || 'Failed to create the end-user account.');
        }
  
        const { suggestedQuestions } = await suggestComplianceQuestions({
          reportType,
          description,
        });
  
        // Query for user if they already existed
        const endUserId = inviteData.uid;

        await addDoc(collection(db, 'tickets'), {
          subjectName,
          email,
          reportType,
          description,
          suggestedQuestions,
          status: 'New',
          createdAt: serverTimestamp(),
          clientId: clientUser.uid,
          clientEmail: clientUser.email,
          endUserId: endUserId || null,
        });
  
        toast({
          title: 'Request Created',
          description: `A new end-user form has been created for ${email}.`,
          variant: 'default',
        });
        
        onUserCreated();
        onOpenChange(false);
  
      } catch (error: any) {
        console.error('Error creating request:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to create request. Please try again.',
          variant: 'destructive',
        });
      } finally {
          setIsLoading(false);
      }
    };
  
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Create New Request</DialogTitle>
              <DialogDescription>
                Provide details for the new investigation subject. An end-user account will be created for them.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
            <div className="grid gap-2">
                <Label htmlFor="subject-name">Subject Name/Company</Label>
                <Input id="subject-name" name="subject-name" required disabled={isLoading} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Subject's Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="The form will be sent to this email"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="report-type">Report Type</Label>
                <Select name="report-type" required disabled={isLoading} defaultValue="background-check">
                  <SelectTrigger id="report-type">
                    <SelectValue placeholder="Select a report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="background-check">
                      Background Check
                    </SelectItem>
                    <SelectItem value="tenant-screening">
                      Tenant Screening
                    </SelectItem>
                    <SelectItem value="employment-verification">
                      Employment Verification
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description & Notes</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Include any specific instructions or details."
                  disabled={isLoading}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? "Creating..." : "Create Request"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    )
  }
