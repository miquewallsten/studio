
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, PlusCircle, ShieldOff } from 'lucide-react';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InviteUserDialog } from '@/components/invite-user-dialog';
import { UserProfileDialog } from '@/components/user-profile-dialog';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './columns';
import type { User } from './schema';
import { useAuthRole } from '@/hooks/use-auth-role';
import { useLanguage } from '@/contexts/language-context';
import { useSecureFetch } from '@/hooks/use-secure-fetch';


export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [allTags, setAllTags] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isInviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const { role, isLoading: isRoleLoading } = useAuthRole();
    const { t } = useLanguage();
    const secureFetch = useSecureFetch();


    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await secureFetch('/api/users');
            const data = await res.json();
            setUsers(data.users);
            setAllTags(data.allTags || []);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [secureFetch]);

    useEffect(() => {
        if (role === 'Super Admin' || role === 'Admin') {
            fetchUsers();
        }
    }, [role, fetchUsers]);
    
    const handleUserInvitedOrUpdated = () => {
        fetchUsers(); // Re-fetch the user list after a new user is invited or updated
    }
    
    const handleDialogClose = () => {
        setSelectedUser(null);
    }

    const memoizedColumns = useMemo(() => columns({ onSelectUser: setSelectedUser, allTags: allTags, onUserUpdated: handleUserInvitedOrUpdated, t }), [allTags, t, handleUserInvitedOrUpdated]);


    if (isRoleLoading) {
      return <p>{t('common.loading')}...</p>
    }

    if (role !== 'Super Admin' && role !== 'Admin') {
      return (
         <Card className="mt-8">
          <CardHeader className="items-center text-center">
            <ShieldOff className="size-12 text-destructive" />
            <CardTitle className="text-2xl">{t('users.access_denied_title')}</CardTitle>
            <CardDescription>
              {t('users.access_denied_desc_1')}
              <br/>
              {t('users.access_denied_desc_2')}
            </CardDescription>
          </CardHeader>
        </Card>
      )
    }
    
    const isCredentialError = error && (error.includes('credential') || error.includes('parse') || error.includes('service account'));


  return (
    <div className="flex-1 space-y-4">
        <InviteUserDialog 
            isOpen={isInviteDialogOpen} 
            onOpenChange={setInviteDialogOpen}
            onUserInvited={handleUserInvitedOrUpdated}
        />
        <UserProfileDialog 
            user={selectedUser}
            allTags={allTags}
            isOpen={!!selectedUser}
            onOpenChange={handleDialogClose}
            onUserUpdated={handleUserInvitedOrUpdated}
        />
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">{t('users.title')}</h1>
        <Button className="bg-accent hover:bg-accent/90" onClick={() => setInviteDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('users.new_user_button')}
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('users.table_title')}</CardTitle>
          <CardDescription>
            {t('users.table_desc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
            {error && (
                 <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{isCredentialError ? 'Configuration Required' : 'Error Fetching Data'}</AlertTitle>
                    <AlertDescription>
                        {error}
                        {isCredentialError && (
                            <p className="mt-2">Please ensure your Firebase Admin credentials are correctly set in your environment variables.</p>
                        )}
                    </AlertDescription>
                </Alert>
            )}
           {loading ? (
             <p>{t('common.loading')}...</p>
           ) : (
            <DataTable 
                columns={memoizedColumns} 
                data={users}
                onRowClick={(row) => setSelectedUser(row.original)}
                tableId="users-table"
            />
           )}
        </CardContent>
      </Card>
    </div>
  );
}
