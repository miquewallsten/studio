
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
import {
  collection,
  onSnapshot,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { differenceInDays, formatDistanceToNow } from 'date-fns';
import { AlertTriangle, RefreshCw, Bell, MailWarning } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResendInviteDialog } from '../resend-invite-dialog';
import { useToast } from '@/hooks/use-toast';


type TenantInvite = {
  id: string;
  name: string;
  invitationSentAt: Timestamp;
};

type PendingSubmission = {
    id: string;
    subjectName: string;
    createdAt: Timestamp;
}

const EXPIRING_INVITE_DAYS = 5;
const PENDING_SUBMISSION_DAYS = 2;

export function NotificationsWidget() {
  const [expiringInvites, setExpiringInvites] = useState<TenantInvite[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<TenantInvite | null>(null);
  const [isResendDialogOpen, setResendDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Listener for expiring tenant invites
    const invitesQuery = query(
      collection(db, 'tenants'),
      where('status', '==', 'INVITED')
    );
    const unsubscribeInvites = onSnapshot(invitesQuery, (querySnapshot) => {
      const invitesData: TenantInvite[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.invitationSentAt && differenceInDays(new Date(), data.invitationSentAt.toDate()) >= EXPIRING_INVITE_DAYS) {
          invitesData.push({ id: doc.id, ...data } as TenantInvite);
        }
      });
      setExpiringInvites(invitesData);
      setLoading(false);
    });

    // Listener for pending end-user submissions
    const submissionsQuery = query(
        collection(db, 'tickets'),
        where('status', '==', 'New')
    );
    const unsubscribeSubmissions = onSnapshot(submissionsQuery, (querySnapshot) => {
        const submissionsData: PendingSubmission[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.createdAt && differenceInDays(new Date(), data.createdAt.toDate()) >= PENDING_SUBMISSION_DAYS) {
                submissionsData.push({ id: doc.id, ...data } as PendingSubmission);
            }
        });
        setPendingSubmissions(submissionsData);
        setLoading(false);
    });


    return () => {
        unsubscribeInvites();
        unsubscribeSubmissions();
    };
  }, []);

  const handleResendClick = (invite: TenantInvite) => {
    setSelectedTenant(invite);
    setResendDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setResendDialogOpen(false);
    setSelectedTenant(null);
  }
  
  const handleResendSubmissionLink = (submission: PendingSubmission) => {
      // In a real implementation, this would trigger a backend flow to generate a new link and send an email.
      // For this prototype, we'll just show a toast message.
      toast({
          title: "Reminder Sent (Simulated)",
          description: `A reminder email has been sent to the subject of ticket ${submission.id.substring(0,5)}...`
      });
  }
  
  const allNotifications = [...expiringInvites, ...pendingSubmissions];


  return (
    <>
      <ResendInviteDialog 
        isOpen={isResendDialogOpen}
        onOpenChange={handleDialogClose}
        tenant={selectedTenant}
      />
      <Card className="h-full flex flex-col">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                  <Bell className="text-accent" />
                  Notifications
              </CardTitle>
              <CardDescription>
                Recent system alerts and required actions.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full non-draggable">
          <div className="p-6 pt-0">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading alerts...</p>
          ) : allNotifications.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-10">
              <p>No notifications right now.</p>
              <p className="text-xs">Your inbox is clear.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {expiringInvites.map((invite) => (
                <li
                  key={invite.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="size-4 text-destructive" />
                      <p className="font-semibold text-destructive">Expired Tenant Invite</p>
                    </div>
                    <p className="text-sm mt-1">
                      Invite for <span className="font-medium">{invite.name}</span> sent{' '}
                      {formatDistanceToNow(invite.invitationSentAt.toDate(), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleResendClick(invite)}
                  >
                    <RefreshCw className="mr-2 size-3" />
                    Resend
                  </Button>
                </li>
              ))}
              {pendingSubmissions.map((submission) => (
                 <li
                  key={submission.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <MailWarning className="size-4 text-orange-500" />
                      <p className="font-semibold text-orange-600">Pending Submission</p>
                    </div>
                    <p className="text-sm mt-1">
                      Form for <span className="font-medium">{submission.subjectName}</span> sent{' '}
                      {formatDistanceToNow(submission.createdAt.toDate(), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleResendSubmissionLink(submission)}
                  >
                    <RefreshCw className="mr-2 size-3" />
                    Resend Link
                  </Button>
                </li>
              ))}
            </ul>
          )}
          </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
}
