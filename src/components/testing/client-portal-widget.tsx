
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, PlusCircle } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, onSnapshot, query, where, Timestamp, addDoc, serverTimestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { suggestComplianceQuestions } from '@/ai/flows/compliance-question-suggestions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';


type Request = {
  id: string;
  subjectName: string;
  reportType: string;
  status: string;
  createdAt: Timestamp;
};

interface ClientPortalWidgetProps {
    title: string;
    description: string;
    onUserCreated: () => void;
}

export function ClientPortalWidget({ title, description, onUserCreated }: ClientPortalWidgetProps) {
  const [user, loadingAuth] = useAuthState(auth);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRequestDialogOpen, setRequestDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'tickets'),
        where('clientId', '==', user.uid)
      );
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
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
      });

      return () => unsubscribe();
    } else if (!loadingAuth) {
        setLoading(false);
        setRequests([]);
    }
  }, [user, loadingAuth]);

  const isClient = !!(user?.stsTokenManager as any)?.claims?.tenantId;
  

  return (
    <Card className="h-full flex flex-col non-draggable">
        <NewRequestDialog 
            isOpen={isRequestDialogOpen}
            onOpenChange={setRequestDialogOpen}
            onUserCreated={onUserCreated}
            clientUser={user}
        />
        <CardHeader>
            <div className="flex items-center justify-between">
                <CardTitle>{title}</CardTitle>
                {isClient && (
                    <Button variant="outline" onClick={() => setRequestDialogOpen(true)}>
                        <PlusCircle className="mr-2" />
                        New Request
                    </Button>
                )}
            </div>
            <CardDescription>
                {description}
                {user && <div className="mt-2 text-xs font-semibold p-2 bg-muted rounded-md border">Viewing as: {user.email} <span className="text-muted-foreground font-normal">(Use Widget 1 to impersonate a different user.)</span></div>}
            </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
            {loadingAuth ? (
                <div className="h-24 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Loading user data...</p>
                </div>
            ) : !user ? (
                <div className="h-24 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">No user impersonated. Use Widget 1.</p>
                </div>
            ) : !isClient ? (
                <div className="h-24 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Impersonated user is not a Client.</p>
                </div>
            ) : (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                        <span className="sr-only">Actions</span>
                    </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                    <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                        Loading requests...
                        </TableCell>
                    </TableRow>
                    ) : requests.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                        You have no active requests.
                        </TableCell>
                    </TableRow>
                    ) : (
                    requests.map((request) => (
                        <TableRow key={request.id}>
                        <TableCell className="font-medium">
                            {request.subjectName}
                            <p className="text-xs text-muted-foreground">{request.reportType}</p>
                        </TableCell>
                        <TableCell>
                            <Badge
                            variant={
                                request.status === 'New' ? 'destructive' : 'secondary'
                            }
                            >
                            {request.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                           <Button asChild variant="ghost" size="icon" disabled>
                                <Link href="#">
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </TableCell>
                        </TableRow>
                    ))
                    )}
                </TableBody>
                </Table>
            )}
        </CardContent>
    </Card>
  );
}

// Dialog Component for creating new request
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
          endUserId: inviteData.uid || null, // Will be null if user already exists, need to query later
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

    