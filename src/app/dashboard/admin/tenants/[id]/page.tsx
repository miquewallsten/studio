'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

type Tenant = {
  id: string;
  name: string;
  createdAt: Timestamp;
};

export default function TenantDetailPage({ params }: { params: { id: string } }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const tenantRef = doc(db, 'tenants', params.id);
    const unsubscribe = onSnapshot(tenantRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTenant({
          id: docSnap.id,
          name: data.name,
          createdAt: data.createdAt,
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [params.id]);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    // In a real app, you would use Firebase Admin SDK on a server
    // to create a user and associate them with the tenantId.
    // For this prototype, we'll simulate the invite.
    
    // This is where you would call a serverless function to:
    // 1. Check if a user with this email already exists.
    // 2. If not, create one using `admin.auth().createUser()`.
    // 3. Set a custom claim on the user token: `admin.auth().setCustomUserClaims(userId, { tenantId: params.id })`.
    // 4. Send a custom invitation email.
    
    // Simulate a delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast({
        title: 'Invitation Sent (Simulated)',
        description: `An invitation has been sent to ${inviteEmail}. They will be associated with the "${tenant?.name}" tenant upon sign-up.`,
    });

    setInviteEmail('');
    setIsInviting(false);
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
                         <Skeleton className="h-20 w-full" />
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-1/2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
  }

  if (!tenant) {
    return <div>Tenant not found.</div>;
  }

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
        <Card>
          <CardHeader className="pb-4">
            <div className="grid gap-1">
              <CardTitle className="text-2xl font-headline">
                Tenant: {tenant.name}
              </CardTitle>
              <CardDescription>
                Created on: {tenant.createdAt ? format(tenant.createdAt.toDate(), 'PPP') : ''}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
             <Card>
                <CardHeader>
                    <CardTitle>Users</CardTitle>
                    <CardDescription>Users associated with this tenant.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed">
                        <p className="text-muted-foreground">Tenant user list will be displayed here.</p>
                    </div>
                </CardContent>
             </Card>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Invite New User</CardTitle>
             <CardDescription>
                Invite a new user to the client portal for this tenant.
              </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInviteUser}>
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="user@client.com"
                        required
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        disabled={isInviting}
                    />
                </div>
                <Button type="submit" className="w-full mt-4 bg-accent hover:bg-accent/90" disabled={isInviting}>
                    <Mail className="mr-2 h-4 w-4" />
                    {isInviting ? 'Sending Invite...' : 'Send Invite'}
                </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
