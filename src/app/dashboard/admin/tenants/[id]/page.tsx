
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
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useSecureFetch } from '@/hooks/use-secure-fetch';

type Tenant = {
  id: string;
  name: string;
  createdAt: string;
};

export default function TenantDetailPage({ params }: { params: { id: string } }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const { toast } = useToast();
  const secureFetch = useSecureFetch();

  useEffect(() => {
      const fetchTenant = async () => {
          try {
              const res = await secureFetch(`/api/tenants/${params.id}`);
              const data = await res.json();
              if (data.error) throw new Error(data.error);
              setTenant(data.tenant);
          } catch(err: any) {
              toast({ title: 'Error', description: 'Could not load tenant data.', variant: 'destructive'});
          } finally {
              setLoading(false);
          }
      }
      fetchTenant();
  }, [params.id, secureFetch, toast]);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    
    try {
        await secureFetch('/api/users/invite', {
            method: 'POST',
            body: JSON.stringify({ email: inviteEmail, role: 'Tenant User', tenantId: params.id }),
        });
        toast({
            title: 'Invitation Sent',
            description: `An invitation has been sent to ${inviteEmail}.`,
        });
        setInviteEmail('');
    } catch(err: any) {
        toast({
            title: 'Invite Failed',
            description: err.message,
            variant: 'destructive',
        });
    } finally {
        setIsInviting(false);
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
                Created on: {tenant.createdAt ? format(new Date(tenant.createdAt), 'PPP') : ''}
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
