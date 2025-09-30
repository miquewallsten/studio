
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useEffect, useState } from 'react';
import { User, ExternalLink } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '../ui/dropdown-menu';

type PortalUser = {
    uid: string;
    email?: string;
}

interface EndUserPortalWidgetProps {
    users: PortalUser[];
    onImpersonate: (uid: string, email?: string) => void;
    isImpersonating: boolean;
}

export function EndUserPortalWidget({ users, onImpersonate, isImpersonating }: EndUserPortalWidgetProps) {
  const [user, loadingAuth] = useAuthState(auth);
  const [iframeKey, setIframeKey] = useState(Date.now());

  useEffect(() => {
    // When the user changes, force the iframe to re-render to reflect the new auth state
    setIframeKey(Date.now());
  }, [user]);

  const role = (user?.stsTokenManager as any)?.claims?.role;
  const isEndUser = role === 'End User';
  const firstTicketId = 'some-ticket-id'; // This would need to be dynamically fetched

  return (
    <Card className="h-full flex flex-col non-draggable">
        <CardHeader>
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                    <CardTitle>End-User Portal</CardTitle>
                    <CardDescription>
                       Impersonate an end-user to fill out forms. Start from the Invitation Inbox.
                    </CardDescription>
                </div>
                 <div className="flex items-center gap-2 flex-shrink-0">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <User className="mr-2"/>
                                {user && isEndUser ? user.email : "Impersonate End-User"}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56">
                            <DropdownMenuLabel>Select an End-User</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {users.map(u => (
                                <DropdownMenuItem key={u.uid} onClick={() => onImpersonate(u.uid, u.email)} disabled={isImpersonating}>
                                    {u.email}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0 m-2 border rounded-lg">
             {loadingAuth ? (
                <div className="h-full flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Loading user data...</p>
                </div>
            ) : !isEndUser ? (
                 <div className="h-full flex items-center justify-center p-4">
                    <p className="text-sm text-muted-foreground text-center">Impersonate an end-user via the Invitation Inbox to see their form.</p>
                </div>
            ) : (
                <iframe key={iframeKey} src={`/form/${firstTicketId}`} className="w-full h-full border-0" />
            )}
        </CardContent>
    </Card>
  );
}

    