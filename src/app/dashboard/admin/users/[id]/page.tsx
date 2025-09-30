
'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';


type User = {
    uid: string;
    email?: string;
    displayName?: string;
    photoURL?: string;
    disabled: boolean;
    tenantId?: string;
    tenantName?: string;
    role: string;
    createdAt: string;
}

export default function UserProfilePage({ params }: { params: { id: string } }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            setLoading(true);
            try {
                // In a real app, you'd fetch this from your own API endpoint
                // that uses the Firebase Admin SDK to get full user details.
                // For now, we'll fetch from the client-side available data.
                // This is NOT secure for a real app but works for prototyping.
                
                // Let's create a placeholder fetch from the existing users API
                // and then find the one we want.
                const response = await fetch('/api/users');
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch users');
                }
                const foundUser = data.users.find((u: User) => u.uid === params.id);
                if (foundUser) {
                    setUser(foundUser);
                } else {
                    setError('User not found.');
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchUser();
        }

    }, [params.id]);


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
            </div>
        )
    }

    if (error) {
        return <div>Error: {error}</div>;
    }
    
    if (!user) {
        return <div>User not found.</div>;
    }

    return (
        <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
          <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
            <Card>
              <CardHeader className="pb-4">
                <div className="grid gap-1">
                  <CardTitle className="text-2xl font-headline">
                    User: {user.email}
                  </CardTitle>
                  <CardDescription>
                    Role: {user.role} | Tenant: {user.tenantName || 'N/A'}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                 <Card>
                    <CardHeader>
                        <CardTitle>User Details</CardTitle>
                        <CardDescription>
                            Full profile and metrics will be displayed here.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed">
                            <p className="text-muted-foreground">Coming soon...</p>
                        </div>
                    </CardContent>
                 </Card>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full">Change Role</Button>
                <Button variant="outline" className="w-full">Assign to Tenant</Button>
                <Button variant="destructive" className="w-full">Disable User</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      );

}
