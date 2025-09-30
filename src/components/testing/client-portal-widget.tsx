
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, PlusCircle, UserCircle, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { suggestComplianceQuestions } from '@/ai/flows/compliance-question-suggestions';

type Request = {
  id: string;
  subjectName: string;
  reportType: string;
  status: string;
  createdAt: Timestamp;
};

export function ClientPortalWidget() {
  const [user, loadingUser] = useAuthState(auth);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRequestDialogOpen, setRequestDialogOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    if (user) {
      const q = query(
        collection(db, 'tickets'),
        where('clientId', '==', user.uid)
      );
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const requestsData: Request[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            requestsData.push({
              id: doc.id,
              subjectName: data.subjectName,
              reportType: data.reportType,
              status: data.status,
              createdAt: data.createdAt,
            });
          });
          setRequests(requestsData.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching client requests:', error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } else {
      setRequests([]); // Clear requests if no user is impersonated
      setLoading(false);
    }
  }, [user]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'New': return 'destructive';
      case 'Completed': return 'default';
      default: return 'secondary';
    }
  };

  const renderContent = () => {
    if (loadingUser || loading) {
        return (
             <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">Loading Client Data...</p>
            </div>
        )
    }

    if (!user) {
      return (
        <div className="flex items-center justify-center h-full text-center p-4">
            <div>
                <UserCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">
                    No client impersonated.
                </p>
                <p className="text-xs text-muted-foreground">
                    Use Widget 1 to log in as a client.
                </p>
            </div>
        </div>
      );
    }
    return (
      <>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Subject</TableHead>
              <TableHead className="text-xs">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center text-sm">
                  No requests found for this client.
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium text-xs py-2">
                    {request.subjectName}
                  </TableCell>
                  <TableCell className="py-2">
                    <Badge variant={getStatusVariant(request.status)} className="text-xs">
                      {request.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </>
    );
  };

  return (
    <>
    <NewRequestDialog 
        isOpen={isRequestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        clientUser={user}
    />
    <Card className="h-full flex flex-col non-draggable">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>2. Client Creates Request</CardTitle>
            <CardDescription className="text-xs">
              {user ? (
                <>
                  <p>Viewing as: {user.email}</p>
                  <p className="italic">Use Widget 1 to impersonate a different user.</p>
                </>
              ) : 'Impersonate a client to begin.'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" disabled={!user}>
              <Link href="/client/dashboard" target="_blank">
                <ExternalLink className="mr-2" /> View Full
              </Link>
            </Button>
            <Button variant="outline" size="sm" disabled={!user} onClick={() => setRequestDialogOpen(true)}>
                <PlusCircle className="mr-2" /> New Request
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-2">
        {renderContent()}
      </CardContent>
    </Card>
    </>
  );
}


function NewRequestDialog({isOpen, onOpenChange, clientUser}: {isOpen: boolean, onOpenChange: (open: boolean) => void, clientUser: any}) {
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
              description: 'You must be logged in as a client to create a request.',
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
        
        if (!inviteResponse.ok && inviteData.error !== 'A user with this email address already exists.') {
          throw new Error(inviteData.error || 'Failed to create the end-user account.');
        }
  
        const { suggestedQuestions } = await suggestComplianceQuestions({
          reportType,
          description,
        });
  
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
          endUserId: inviteData.uid, 
        });
  
        toast({
          title: 'Request Created & User Invited',
          description: `The End-User now appears in Widget 1. A form is pending for them in Widget 3.`,
          variant: 'default',
          duration: 8000,
        });
  
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Request</DialogTitle>
            <DialogDescription>
              This creates a new End-User and dispatches a form, simulating Step 2 and 3 of the workflow.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
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
                <Select name="report-type" required disabled={isLoading}>
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
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" className="bg-accent hover:bg-accent/90" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create & Send Form'}
                </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }
  
  
