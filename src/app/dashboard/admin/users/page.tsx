
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


    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await secureFetch('/api/users');
            if (data.error) {
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
        if (role === 'Super Admin' || role === 'Admin') {
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
    const isPemError = error && error.includes('Invalid PEM formatted message');

    const memoizedColumns = useMemo(() => columns({ onSelectUser: setSelectedUser, allTags: allTags, onUserUpdated: handleUserInvitedOrUpdated, t }), [allTags, t]);


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
                    <AlertTitle>{isCredentialError || isPemError ? t('users.config_required') : t('users.error_fetching')}</AlertTitle>
                    <AlertDescription>
                        {error}
                        {isPemError && (
                            <div className="mt-4 bg-gray-900 text-white p-4 rounded-md text-sm">
                                <p className="font-semibold">Action Required: Fix Private Key Format</p>
                                <p className="mt-2">The `FIREBASE_PRIVATE_KEY` in your `.env` file is not formatted correctly. It must be a single line with `\n` for newlines.</p>
                                <ol className="list-decimal list-inside space-y-2 mt-3">
                                    <li>Open your service account JSON file.</li>
                                    <li>Copy the entire `private_key` value, including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines.</li>
                                    <li>Paste it into a text editor.</li>
                                    <li>Manually replace every newline character with the two characters `\n`.</li>
                                    <li>The result should be a single, long line of text.</li>
                                    <li>Copy this new single line and paste it into your `.env` file.</li>
                                </ol>
                                <p className="mt-3 font-semibold">It should look like this:</p>
                                <pre className="mt-1 text-xs bg-gray-800 p-2 rounded whitespace-pre-wrap">
{`FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...your key content...\\n...more key content...\\n-----END PRIVATE KEY-----\\n"`}
                                </pre>
                            </div>
                        )}
                        {isCredentialError && !isPemError && (
                            <div className="mt-4 bg-gray-900 text-white p-4 rounded-md text-sm">
                                <p className="font-semibold">Action Required: Set Server Credentials</p>
                                <p className="mt-2">To use server-side features like user management, you must provide a Firebase Service Account key.</p>
                                <ol className="list-decimal list-inside space-y-2 mt-3">
                                    <li>
                                        Go to your Firebase project, click the <span className="font-mono text-xs bg-gray-700 px-1 py-0.5 rounded">Gear icon</span> next to "Project Overview", then select <span className="font-mono text-xs bg-gray-700 px-1 py-0.5 rounded">Project settings</span>.
                                    </li>
                                    <li>
                                        Go to the <span className="font-mono text-xs bg-gray-700 px-1 py-0.5 rounded">Service accounts</span> tab.
                                    </li>
                                    <li>
                                        Click the <span className="font-mono text-xs bg-gray-700 px-1 py-0.5 rounded">Generate new private key</span> button to download a JSON file.
                                    </li>
                                     <li>Open the `.env` file in the file explorer to your left.</li>
                                    <li>Copy the `project_id`, `client_email`, and `private_key` from the JSON file and paste them into your `.env` file. See the guide above for formatting the private key.</li>
                                </ol>
                                <pre className="mt-3 text-xs bg-gray-800 p-2 rounded whitespace-pre-wrap">
{`FIREBASE_PROJECT_ID="..."
FIREBASE_CLIENT_EMAIL="..."
FIREBASE_PRIVATE_KEY="..."`}
                                </pre>
                                <p className="mt-3">The application will automatically restart and pick up these new values.</p>
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
