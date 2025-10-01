
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
import { AlertTriangle, RefreshCw, Bell } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResendInviteDialog } from '../resend-invite-dialog';


type TenantInvite = {
  id: string;
  name: string;
  invitationSentAt: Timestamp;
};

const EXPIRATION_DAYS = 5;

export function NotificationsWidget() {
  const [invites, setInvites] = useState<TenantInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<TenantInvite | null>(null);
  const [isResendDialogOpen, setResendDialogOpen] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'tenants'),
      where('status', '==', 'INVITED')
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const invitesData: TenantInvite[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.invitationSentAt) {
          invitesData.push({ id: doc.id, ...data } as TenantInvite);
        }
      });
      setInvites(invitesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleResendClick = (invite: TenantInvite) => {
    setSelectedTenant(invite);
    setResendDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setResendDialogOpen(false);
    setSelectedTenant(null);
  }

  const expiringInvites = invites.filter((invite) => {
    const sentAt = invite.invitationSentAt.toDate();
    return differenceInDays(new Date(), sentAt) >= EXPIRATION_DAYS;
  });

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
        <CardContent className="flex-1 overflow-hidden p-0 non-draggable">
          <ScrollArea className="h-full">
          <div className="p-6 pt-0">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading alerts...</p>
          ) : expiringInvites.length === 0 ? (
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
                      <p className="font-semibold text-destructive">Expired Invite</p>
                    </div>
                    <p className="text-sm mt-1">
                      The invite for <span className="font-medium">{invite.name}</span> was sent{' '}
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
            </ul>
          )}
          </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
}
