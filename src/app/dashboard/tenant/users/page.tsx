'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, PlusCircle } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './columns';
import type { User } from './schema';
import { useAuthRole } from '@/hooks/use-auth-role';
import { useLanguage } from '@/contexts/language-context';
import { useSecureFetch } from '@/hooks/use-secure-fetch';
import { TenantInviteUserDialog } from '@/components/tenant-invite-user-dialog';

export default function TenantUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isInviteDialogOpen, setInviteDialogOpen] = useState(false);
    const { role, user, isLoading: isRoleLoading } = useAuthRole();
    const { t } = useLanguage();
    const secureFetch = useSecureFetch();

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await secureFetch('/api/users');
            if (data.error) {
                throw new Error(data.error || 'Failed to fetch users');
            }
            setUsers(data.users);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (role === 'Tenant Admin') {
            fetchUsers();
        }
    }, [role]);
    
    const handleUserInvited = () => {
        fetchUsers(); 
    }

    const memoizedColumns = useMemo(() => columns({ t }), [t]);

    if (isRoleLoading) {
      return <p>{t('common.loading')}...</p>
    }

  return (
    <div className="flex-1 space-y-4">
        <TenantInviteUserDialog
            isOpen={isInviteDialogOpen}
            onOpenChange={setInviteDialogOpen}
            onUserInvited={handleUserInvited}
        />
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Manage Users</h1>
         <Button onClick={() => setInviteDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Invite User
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>My Organization's Users</CardTitle>
          <CardDescription>
            A list of all users in your organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {error && (
                 <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Fetching Users</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
           {loading ? (
             <p>{t('common.loading')}...</p>
           ) : (
            <DataTable 
                columns={memoizedColumns} 
                data={users}
                tableId="tenant-users-table"
            />
           )}
        </CardContent>
      </Card>
    </div>
  );
}
