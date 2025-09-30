
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
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

type TenantInvite = {
  id: string;
  name: string;
  invitationSentAt: Timestamp;
};

const EXPIRATION_DAYS = 5;

export function ExpiringInvitesWidget() {
  const [invites, setInvites] = useState<TenantInvite[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleResend = (tenantId: string) => {
    // This will be implemented in the next step.
    console.log(`Resending invite for tenant ${tenantId}`);
    alert('Resend functionality will be implemented next.');
  };

  const expiringInvites = invites.filter((invite) => {
    const sentAt = invite.invitationSentAt.toDate();
    return differenceInDays(new Date(), sentAt) >= EXPIRATION_DAYS;
  });

  return (
    <Card className="h-full flex flex-col non-draggable">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="text-destructive" />
                Invitation Alerts
            </CardTitle>
            <CardDescription>
              Tenant invitations that are over 5 days old and require action.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
        <div className="p-6 pt-0">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading alerts...</p>
        ) : expiringInvites.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-10">
            <p>No pending alerts.</p>
            <p className="text-xs">All invitations are up to date.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {expiringInvites.map((invite) => (
              <li
                key={invite.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <p className="font-semibold">{invite.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Sent{' '}
                    {formatDistanceToNow(invite.invitationSentAt.toDate(), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleResend(invite.id)}
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
  );
}
