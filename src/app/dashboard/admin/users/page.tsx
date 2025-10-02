
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
import { useEffect, useState, useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InviteUserDialog } from '@/components/invite-user-dialog';
import { UserProfileDialog } from '@/components/user-profile-dialog';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './columns';
import type { User } from './schema';
import { useAuthRole } from '@/hooks/use-auth-role';
import { useLanguage } from '@/contexts/language-context';


export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [allTags, setAllTags] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isInviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const { role, isLoading: isRoleLoading } = useAuthRole();
    const { t } = useLanguage();


    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/users');
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch users');
            }
            setUsers(data.users);
            setAllTags(data.allTags || []);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (role === 'Super Admin') {
            fetchUsers();
        }
    }, [role]);
    
    const handleUserInvitedOrUpdated = () => {
        fetchUsers(); // Re-fetch the user list after a new user is invited or updated
    }
    
    const handleDialogClose = () => {
        setSelectedUser(null);
    }

    const isCredentialError = error && (error.includes('credential') || error.includes('FIREBASE_PROJECT_ID'));

    const memoizedColumns = useMemo(() => columns({ onSelectUser: setSelectedUser, allTags: allTags, onUserUpdated: handleUserInvitedOrUpdated, t }), [allTags, t]);


    if (isRoleLoading) {
      return <p>{t('common.loading')}...</p>
    }

    if (role !== 'Super Admin') {
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
                    <AlertTitle>{isCredentialError ? t('users.config_required') : t('users.error_fetching')}</AlertTitle>
                    <AlertDescription>
                        {error}
                        {isCredentialError && (
                            <div className="mt-4 bg-gray-900 text-white p-4 rounded-md">
                                <p className="font-semibold">Action Required:</p>
                                <p className="mt-2 text-sm">To fetch the user list, you must provide server-side credentials.</p>
                                <ul className="list-disc list-inside text-xs mt-2 space-y-1">
                                    <li>Go to your Firebase Project Settings -&gt; Service accounts.</li>
                                    <li>Click "Generate new private key" to download a JSON file.</li>
                                    <li>Open the `.env` file in the project root.</li>
                                    <li>Copy the `project_id`, `client_email`, and `private_key` from the JSON file into your `.env` file.</li>
                                </ul>
                                <pre className="mt-3 text-xs bg-gray-800 p-2 rounded">
{`FIREBASE_PROJECT_ID="..."
FIREBASE_CLIENT_EMAIL="..."
FIREBASE_PRIVATE_KEY="..."`}
                                </pre>
                            </div>
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
