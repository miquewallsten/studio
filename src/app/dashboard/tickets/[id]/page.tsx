
'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
  } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileUp, MessageSquare, Save, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { doc, onSnapshot, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

type Ticket = {
  id: string;
  subjectName: string;
  reportType: string;
  status: string;
  createdAt: Timestamp;
  description: string;
  clientEmail: string;
  formData?: { [key: string]: string };
  internalNotes?: { [key: string]: string };
};

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [internalNotes, setInternalNotes] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const ticketRef = doc(db, 'tickets', params.id);
    const unsubscribe = onSnapshot(ticketRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Ticket;
        setTicket({ id: docSnap.id, ...data });
        setInternalNotes(data.internalNotes || {});
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [params.id]);

  const handleNoteChange = (fieldName: string, value: string) => {
    setInternalNotes(prev => ({...prev, [fieldName]: value}));
  }

  const handleSaveNotes = async () => {
    if (!ticket) return;
    setIsSaving(true);
    try {
        const ticketRef = doc(db, 'tickets', ticket.id);
        await updateDoc(ticketRef, {
            internalNotes: internalNotes
        });
        toast({
            title: 'Notes Saved',
            description: 'Your internal notes have been successfully saved.',
        })
    } catch (error: any) {
        toast({
            title: 'Error Saving Notes',
            description: error.message || 'An unknown error occurred.',
            variant: 'destructive'
        })
    } finally {
        setIsSaving(false);
    }
  }


  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'New': return 'destructive';
      case 'Completed': return 'default';
      default: return 'secondary';
    }
  }

  if (loading) {
    return (
        <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
            <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-1/4" />
                    </CardHeader>
                    <CardContent>
                         <Skeleton className="h-40 w-full" />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-1/2" />
                    </CardHeader>
                    <CardContent>
                         <Skeleton className="h-60 w-full" />
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-6">
                 <Card>
                    <CardHeader>
                         <Skeleton className="h-8 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
  }

  if (!ticket) {
    return <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">Ticket not found.</div>
  }

  const hasFormData = ticket.formData && Object.keys(ticket.formData).length > 0;

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="grid gap-1">
                <CardTitle className="text-2xl font-headline">
                  Investigation: {ticket.subjectName}
                </CardTitle>
                <CardDescription>
                  Ticket ID: {ticket.id.substring(0, 7)}
                </CardDescription>
              </div>
              <Badge className="text-sm" variant={getStatusVariant(ticket.status)}>
                {ticket.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h3 className="font-semibold text-muted-foreground">Requested By</h3>
                  <p>{ticket.clientEmail}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-muted-foreground">Requested On</h3>
                  <p>{ticket.createdAt ? format(ticket.createdAt.toDate(), 'PPP') : ''}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-muted-foreground">Report Type</h3>
                  <p>{ticket.reportType}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-muted-foreground">Client Notes</h3>
                <p className="text-sm">
                  {ticket.description || 'No notes provided.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
              <CardTitle>Form Submission & Notes</CardTitle>
              <CardDescription>Data submitted by the end-user and internal notes from the analyst.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {hasFormData ? (
                    Object.entries(ticket.formData!).map(([key, value]) => (
                        <div key={key} className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">{key}</Label>
                                <div className="p-3 border rounded-md min-h-[100px] bg-muted/50">
                                    <p className="text-sm">{value}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor={`note-${key}`}>Internal Analyst Notes</Label>
                                <Textarea 
                                    id={`note-${key}`} 
                                    placeholder="Add internal notes for this field..." 
                                    className="min-h-[100px]"
                                    value={internalNotes[key] || ''}
                                    onChange={(e) => handleNoteChange(key, e.target.value)}
                                />
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed">
                        <p className="text-muted-foreground">The end-user has not submitted the form yet.</p>
                    </div>
                )}
            </CardContent>
            {hasFormData && (
                <CardFooter>
                     <Button onClick={handleSaveNotes} disabled={isSaving}>
                        <Save className="mr-2" />
                        {isSaving ? 'Saving...' : 'Save All Notes'}
                    </Button>
                </CardFooter>
            )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Feed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-40 items-center justify-center rounded-md border border-dashed">
              <p className="text-sm text-muted-foreground flex items-center gap-2"><MessageSquare className="size-4" /> No activity yet.</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Analyst Actions</CardTitle>
            <CardDescription>
              For internal use by managers and analysts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" variant="outline">
              <UserPlus className="mr-2 size-4" /> Assign Analyst
            </Button>
            <Button className="w-full">
              <FileUp className="mr-2 size-4" /> Upload Report
            </Button>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">This section is role-restricted.</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}


    