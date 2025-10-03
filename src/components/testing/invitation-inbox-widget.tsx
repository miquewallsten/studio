
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { Mail, Send } from 'lucide-react';
import { useSecureFetch } from '@/hooks/use-secure-fetch';

type Ticket = {
  id: string;
  subjectName: string;
  email: string;
  reportType: string;
  status: string;
  createdAt: string; // ISO string
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
  const secureFetch = useSecureFetch();

  useEffect(() => {
    const fetchInvites = async () => {
        setLoading(true);
        try {
            const res = await secureFetch('/api/tickets?status=New');
            const data = await res.json();
            if (data.tickets) {
                const invites = data.tickets.filter((t: Ticket) => t.endUserId);
                setPendingInvitations(invites);
            }
        } catch (error) {
            console.error("Failed to fetch pending invitations:", error);
        } finally {
            setLoading(false);
        }
    };
    
    fetchInvites();
    const interval = setInterval(fetchInvites, 5000); // Poll for new invites

    return () => clearInterval(interval);
  }, [secureFetch]);

  const handleImpersonateAndFill = (uid: string, email?: string) => {
    onImpersonate(uid, email);
    // Future enhancement: could automatically switch focus to the End-User Portal widget.
  }
  

  return (
    <Card className="h-full flex flex-col">
        <CardHeader className="non-draggable">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <CardTitle>Invitation Inbox</CardTitle>
                    <CardDescription>
                        Simulated inbox for new end-users who need to fill out a form.
                    </CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-4 non-draggable">
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
                            <p className="text-xs text-muted-foreground">{new Date(invite.createdAt).toLocaleTimeString()}</p>
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
