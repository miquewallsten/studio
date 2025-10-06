
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
import { differenceInDays, formatDistanceToNow } from 'date-fns';
import { AlertTriangle, RefreshCw, Bell, MailWarning } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResendInviteDialog } from '../resend-invite-dialog';
import { useToast } from '@/hooks/use-toast';
import { useSecureFetch } from '@/hooks/use-secure-fetch';

type TenantInvite = {
  id: string;
  name: string;
  invitationSentAt: string;
};

type PendingSubmission = {
  id: string;
  subjectName: string;
  createdAt: string;
};

const EXPIRING_INVITE_DAYS = 5;
const PENDING_SUBMISSION_DAYS = 2;

export function NotificationsWidget() {
  const [expiringInvites, setExpiringInvites] = useState<TenantInvite[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<TenantInvite | null>(null);
  const [isResendDialogOpen, setResendDialogOpen] = useState(false);
  const { toast } = useToast();
  const secureFetch = useSecureFetch();

  useEffect(() => {
    let alive = true;

    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const [tenantsRes, ticketsRes] = await Promise.all([
          secureFetch('/api/tenants'),
          secureFetch('/api/tickets'),
        ]);

        if (!alive) return;

        if (tenantsRes.ok) {
            const tenantsData = await tenantsRes.json();
            const invites = (tenantsData?.tenants ?? []).filter((t: any) =>
              t?.status === 'INVITED' &&
              t?.invitationSentAt &&
              differenceInDays(new Date(), new Date(t.invitationSentAt)) >= EXPIRING_INVITE_DAYS
            );
            setExpiringInvites(invites);
        } else {
            console.error("Failed to fetch tenants for notifications");
        }
        
        if (ticketsRes.ok) {
            const ticketsData = await ticketsRes.json();
            const submissions = (ticketsData?.tickets ?? []).filter((t: any) =>
              t?.status === 'New' &&
              t?.createdAt &&
              differenceInDays(new Date(), new Date(t.createdAt)) >= PENDING_SUBMISSION_DAYS
            );
            setPendingSubmissions(submissions);
        } else {
            console.error("Failed to fetch tickets for notifications");
        }
        
      } catch (e: any) {
        console.error("Error fetching notifications:", e.message);
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchNotifications();
    const id = setInterval(fetchNotifications, 60_000);
    return () => { alive = false; clearInterval(id); };
  }, [secureFetch]);

  const handleResendClick = (invite: TenantInvite) => {
    setSelectedTenant(invite);
    setResendDialogOpen(true);
  };

  const handleDialogClose = () => {
    setResendDialogOpen(false);
    setSelectedTenant(null);
  };

  const handleResendSubmissionLink = (submission: PendingSubmission) => {
    toast({
      title: "Reminder Sent (Simulated)",
      description: `A reminder email has been sent to the subject of ticket ${submission.id.substring(0,5)}...`,
    });
  };

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
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Expiring invites and pending submissions needing attention
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 pt-0">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : allNotifications.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MailWarning className="h-4 w-4" />
              No notifications right now.
            </div>
          ) : (
            <ScrollArea className="h-[260px] pr-2">
              <div className="space-y-3">
                {expiringInvites.map((inv) => (
                  <div
                    key={`inv-${inv.id}`}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <div className="text-sm">
                        <div className="font-medium">{inv.name}</div>
                        <div className="text-muted-foreground">
                          Invite sent{' '}
                          {formatDistanceToNow(new Date(inv.invitationSentAt), { addSuffix: true })}
                          . Approaching expiry.
                        </div>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleResendClick(inv)}>
                      Resend Invite
                    </Button>
                  </div>
                ))}

                {pendingSubmissions.map((ps) => (
                  <div
                    key={`ps-${ps.id}`}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <div className="text-sm">
                        <div className="font-medium">{ps.subjectName}</div>
                        <div className="text-muted-foreground">
                          Created{' '}
                          {formatDistanceToNow(new Date(ps.createdAt), { addSuffix: true })}
                          . Still awaiting submission.
                        </div>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleResendSubmissionLink(ps)}>
                      Send Reminder
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </>
  );
}
