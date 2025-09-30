'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';

export default function NewTenantPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [tenantName, setTenantName] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    if (!tenantName) {
      toast({
        title: 'Error',
        description: 'Tenant Name is required.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'tenants'), {
        name: tenantName,
        createdAt: serverTimestamp(),
      });

      toast({
        title: 'Tenant Created',
        description: `The "${tenantName}" tenant has been created. You can now invite users.`,
      });

      router.push(`/dashboard/admin/tenants/${docRef.id}`);
    } catch (error) {
      console.error('Error creating tenant:', error);
      toast({
        title: 'Error',
        description: 'Failed to create tenant. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-2">
      <h1 className="text-3xl font-semibold font-headline">Create New Tenant</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Details</CardTitle>
              <CardDescription>
                Create a new client tenant. After creation, you will be able to invite users to this tenant.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tenant-name">Tenant Name</Label>
                <Input
                  id="tenant-name"
                  name="tenant-name"
                  placeholder="e.g., Acme Corporation"
                  required
                  disabled={isLoading}
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/admin/tenants">Cancel</Link>
            </Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Tenant'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
