
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Mail, Send } from 'lucide-react';
import { getAdminAuth } from '@/lib/firebase-admin';

type Ticket = {
  id: string;
  subjectName: string;
  email: string;
  reportType: string;
  status: string;
  createdAt: Timestamp;
  endUserId: string;
  clientEmail: string;
};

interface InvitationInboxWidgetProps {
    onImpersonate: (uid: string, email?: string) => void;
    isImpersonating: boolean;
}

export function InvitationInboxWidget({ onImpersonate, isImpersonating }: InvitationInboxWidgetProps) {
  const [pendingInvitations, setPendingInvitations] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'tickets'),
      where('status', '==', 'New')
    );
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const invitesData: Ticket[] = [];
       querySnapshot.forEach(doc => {
            const data = doc.data();
            // We only want to show invitations for users who have just been created
            // A good proxy for this is if they haven't submitted the form yet (status is 'New')
            // and have an associated endUserId.
            if (data.endUserId) {
                 invitesData.push({ id: doc.id, ...data } as Ticket);
            }
       });

      setPendingInvitations(invitesData.sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleImpersonateAndFill = (uid: string, email?: string) => {
    onImpersonate(uid, email);
    // Future enhancement: could automatically switch focus to the End-User Portal widget.
  }
  

  return (
    <Card className="h-full flex flex-col non-draggable">
        <CardHeader>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <CardTitle>Invitation Inbox</CardTitle>
                    <CardDescription>
                        Simulated inbox for new end-users who need to fill out a form.
                    </CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-4">
             {loading ? (
                <div className="h-24 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Loading invitations...</p>
                </div>
            ) : pendingInvitations.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    <Mail className="size-10 text-muted-foreground mb-4" />
                    <h3 className="font-semibold">Inbox Zero</h3>
                    <p className="text-sm text-muted-foreground">No pending invitations right now.</p>
                    <p className="text-xs text-muted-foreground mt-2">Create a new request in the Client Portal to see an invitation appear here.</p>
                </div>
            ) : (
                pendingInvitations.map((invite) => (
                    <div key={invite.id} className="border rounded-lg p-4 bg-card">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs text-muted-foreground">To: {invite.email}</p>
                                <p className="font-semibold">{invite.reportType} Request</p>
                            </div>
                            <p className="text-xs text-muted-foreground">{new Date(invite.createdAt.seconds * 1000).toLocaleTimeString()}</p>
                        </div>
                        <div className="mt-2 py-2">
                             <p className="text-sm">
                                You've been asked by <span className="font-medium">{invite.clientEmail}</span> to complete an information request form.
                            </p>
                        </div>
                        <div className="flex justify-end">
                            <Button size="sm" onClick={() => handleImpersonateAndFill(invite.endUserId, invite.email)} disabled={isImpersonating}>
                                <Send className="mr-2"/>
                                Set Password & Fill Form
                            </Button>
                        </div>
                    </div>
                ))
            )}
        </CardContent>
    </Card>
  );
}

