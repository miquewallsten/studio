
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
import { Smartphone } from 'lucide-react';

export function MobileEndUserPortalWidget() {
  const [user, loadingAuth] = useAuthState(auth);
  const [iframeKey, setIframeKey] = useState(Date.now());

  useEffect(() => {
    // When the user changes, force the iframe to re-render to reflect the new auth state
    setIframeKey(Date.now());
  }, [user]);

  const role = (user?.stsTokenManager as any)?.claims?.role;
  const isEndUser = role === 'End User';
  const firstTicketId = 'some-ticket-id'; 

  return (
    <Card className="h-full flex flex-col">
        <CardHeader className="non-draggable">
            <div className="flex items-center gap-2">
                <Smartphone className="size-5" />
                <div>
                    <CardTitle>Mobile End-User Portal</CardTitle>
                    <CardDescription>
                       A preview of the form-filling experience on a mobile device.
                    </CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center p-2 non-draggable">
            <div className="w-[300px] h-[600px] bg-neutral-800 rounded-[30px] p-3 shadow-2xl border-4 border-neutral-900">
                 {loadingAuth ? (
                    <div className="h-full w-full bg-black rounded-[18px] flex items-center justify-center">
                        <p className="text-sm text-neutral-400">Loading...</p>
                    </div>
                ) : !isEndUser ? (
                    <div className="h-full w-full bg-black rounded-[18px] flex items-center justify-center p-4">
                        <p className="text-sm text-neutral-400 text-center">Impersonate an end-user to see their form here.</p>
                    </div>
                ) : (
                    <iframe 
                        key={iframeKey} 
                        src={`/form/${firstTicketId}`} 
                        className="w-full h-full border-0 rounded-[18px]" 
                    />
                )}
            </div>
        </CardContent>
    </Card>
  );
}
