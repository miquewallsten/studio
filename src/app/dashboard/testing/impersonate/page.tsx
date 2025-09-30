

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LogIn, AlertCircle, LayoutDashboard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { auth } from '@/lib/firebase';
import { signInWithCustomToken } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { ClientPortalWidget } from '@/components/testing/client-portal-widget';
import { EndUserPortalWidget } from '@/components/testing/end-user-portal-widget';
import { WorkflowWidget } from '@/components/testing/workflow-widget';
import { AnalystPortalWidget } from '@/components/testing/analyst-portal-widget';

const ResponsiveGridLayout = WidthProvider(Responsive);

type User = {
    uid: string;
    email?: string;
    role: string;
    tenantName: string | null;
}

const WIDGET_DEFINITIONS: {
  [key: string]: { title: string; defaultLayout: Layout, description: string };
} = {
  'impersonation': {
    title: '1. Impersonate User',
    description: 'Select a user to log in as. This will update all portals below to reflect their role and permissions.',
    defaultLayout: { i: 'impersonation', x: 0, y: 0, w: 2, h: 4, minW: 2, minH: 3 },
  },
  'client-portal': {
    title: '2. Client Creates Request',
    description: "When impersonating a Client, this portal will show their requests. Use the 'New Request' button to create a ticket for an end-user.",
    defaultLayout: { i: 'client-portal', x: 2, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
  },
  'end-user-portal': {
    title: '3. End-User Fills Form',
    description: "After a client creates a request for a new end-user, impersonate that user here. Their pending form will appear in this widget.",
    defaultLayout: { i: 'end-user-portal', x: 2, y: 2, w: 4, h: 2, minW: 3, minH: 2 },
  },
  'manager-portal': {
    title: "4 & 6. Manager's Portal",
    description: "This portal shows the full ticket lifecycle. Drag tickets from 'New' to an analyst's column to assign them. Drag them to 'Completed' to close them.",
    defaultLayout: { i: 'manager-portal', x: 0, y: 4, w: 6, h: 4, minW: 4, minH: 3 },
  },
   'analyst-portal': {
    title: "5. Analyst Workload",
    description: "This portal gives a manager's overview of all work assigned to analysts. Analysts can submit tickets for review from here.",
    defaultLayout: { i: 'analyst-portal', x: 0, y: 8, w: 6, h: 3, minW: 4, minH: 3 },
  },
};


export default function ImpersonateUserPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [impersonatingUid, setImpersonatingUid] = useState<string | null>(null);
    const { toast } = useToast();

    const [isClient, setIsClient] = useState(false);
    const [layouts, setLayouts] = useState<{[key: string]: Layout[]}>({});
    const [isEditMode, setIsEditMode] = useState(false);


    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/users');
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch users');
            }
            return data.users.sort((a: User, b: User) => (a.email || '').localeCompare(b.email || ''));
        } catch (err: any) {
            console.error(err);
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    };

    const ensureUserExists = async (allUsers: User[], email: string, role: string) => {
        if (!allUsers.some(u => u.email === email)) {
            try {
                const res = await fetch('/api/users/invite', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, role }),
                });
                 if (!res.ok) {
                    const data = await res.json();
                    if (data.error && data.error.includes('already exists')) {
                        return false;
                    }
                    throw new Error(data.error || `Failed to create ${role}`);
                }
                return true; // Indicates a user was created
            } catch (e: any) {
                console.error(`Failed to create user ${email}:`, e.message);
                setError(e.message);
                return false;
            }
        }
        return false;
    };


    useEffect(() => {
        setIsClient(true);
        let isMounted = true;
         try {
            const savedLayouts = window.localStorage.getItem('testing-dashboard-layouts');
            if (savedLayouts && isMounted) setLayouts(JSON.parse(savedLayouts));
        } catch (error) {
            console.error('Could not load layout from localStorage', error);
        }

        const initialize = async () => {
            let initialUsers = await fetchUsers();
            if (!isMounted) return;

            // This ensures our default testing users exist for the workflow.
            const createdManager = await ensureUserExists(initialUsers, 'manager@example.com', 'Manager');
            const createdAnalystA = await ensureUserExists(initialUsers, 'analyst.a@example.com', 'Analyst');
            const createdAnalystB = await ensureUserExists(initialUsers, 'analyst.b@example.com', 'Analyst');

            if (createdManager || createdAnalystA || createdAnalystB) {
                toast({ title: 'Seeding Users', description: 'Default Manager and Analyst users have been created for testing.'});
                initialUsers = await fetchUsers(); // Re-fetch to get the new users
            }
            
            if (isMounted) {
                setUsers(initialUsers);
            }
        };

        initialize();

        return () => { isMounted = false; };
    }, [toast]);


    const handleImpersonate = async (targetUid: string, targetEmail?: string) => {
        setImpersonatingUid(targetUid);
        try {
            const res = await fetch('/api/auth/impersonate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUid }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to start impersonation');
            }
            
            // This sequence is important: sign out the current user (admin),
            // then sign in with the custom token for the new user.
            await auth.signOut();
            await signInWithCustomToken(auth, data.customToken);

            toast({
                title: 'Impersonation Started',
                description: `You are now logged in as ${targetEmail || 'user'}. The portals have been updated.`,
            });
            
        } catch (err: any) {
            toast({
                title: 'Impersonation Failed',
                description: err.message,
                variant: 'destructive',
            });
        } finally {
            setImpersonatingUid(null);
        }
    }

    const handleRefreshUsers = () => {
      fetchUsers().then(setUsers);
    }
    
    const onLayoutChange = (layout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
        if (isEditMode) {
            try {
                window.localStorage.setItem('testing-dashboard-layouts', JSON.stringify(allLayouts));
                setLayouts(allLayouts);
            } catch (error) {
                console.error('Could not save layouts to localStorage', error);
            }
        }
    };
    
    const isCredentialError = error && (error.includes('credential') || error.includes('FIREBASE_PROJECT_ID'));
    const activeWidgets = Object.keys(WIDGET_DEFINITIONS);

    const getWidgetContent = (widgetId: string) => {
        switch(widgetId) {
            case 'impersonation':
                return (
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle>{WIDGET_DEFINITIONS.impersonation.title}</CardTitle>
                            <CardDescription>{WIDGET_DEFINITIONS.impersonation.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto">
                            {error && (
                                <Alert variant="destructive" className="mb-4">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>{isCredentialError ? 'Configuration Required' : 'Error Fetching Users'}</AlertTitle>
                                    <AlertDescription>
                                        {error}
                                        {isCredentialError && (
                                            <p className="mt-2">Please ensure your server-side Firebase Admin credentials are correctly set in your `.env` file.</p>
                                        )}
                                    </AlertDescription>
                                </Alert>
                            )}
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role/Tenant</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center">Loading users...</TableCell>
                                        </TableRow>
                                    ) : !error && users.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center">No users found.</TableCell>
                                        </TableRow>
                                    ) : (
                                        users.map(user => (
                                            <TableRow key={user.uid} className={auth.currentUser?.uid === user.uid ? 'bg-muted/50' : ''}>
                                                <TableCell className="font-medium text-xs truncate max-w-[120px]">{user.email || 'N/A'} {auth.currentUser?.uid === user.uid && '(You)'}</TableCell>
                                                <TableCell>
                                                    <Badge variant={user.role === 'End User' ? 'outline' : 'secondary'}>{user.tenantName || user.role}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="outline" size="sm" onClick={() => handleImpersonate(user.uid, user.email)} disabled={loading || impersonatingUid === user.uid || auth.currentUser?.uid === user.uid}>
                                                        <LogIn className="mr-2 h-4 w-4" />
                                                        {impersonatingUid === user.uid ? '...' : 'Login as'}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                );
            case 'client-portal':
                return <ClientPortalWidget title={WIDGET_DEFINITIONS['client-portal'].title} description={WIDGET_DEFINITIONS['client-portal'].description} onUserCreated={handleRefreshUsers} />;
            case 'end-user-portal':
                return <EndUserPortalWidget title={WIDGET_DEFINITIONS['end-user-portal'].title} description={WIDGET_DEFINITIONS['end-user-portal'].description}/>;
            case 'manager-portal':
                 return <WorkflowWidget title={WIDGET_DEFINITIONS['manager-portal'].title} description={WIDGET_DEFINITIONS['manager-portal'].description} analysts={users.filter(u => u.role === 'Analyst')} />;
            case 'analyst-portal':
                return <AnalystPortalWidget title={WIDGET_DEFINITIONS['analyst-portal'].title} description={WIDGET_DEFINITIONS['analyst-portal'].description} />;
            default:
                return null;
        }
    }
    
    const finalLayout = activeWidgets.map(id => layouts.lg?.find(l => l.i === id) || WIDGET_DEFINITIONS[id].defaultLayout);

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Live Workflow Dashboard</h1>
         <Button
            variant={isEditMode ? 'default' : 'outline'}
            onClick={() => setIsEditMode(!isEditMode)}
            className={isEditMode ? 'bg-accent hover:bg-accent/90' : ''}
        >
            <LayoutDashboard className="mr-2" />
            {isEditMode ? 'Done Editing' : 'Edit Dashboard'}
        </Button>
      </div>
      
       {isClient && 
        <ResponsiveGridLayout
            className={`layout ${!isEditMode ? 'non-interactive' : ''}`}
            layouts={layouts}
            layout={finalLayout}
            onLayoutChange={onLayoutChange}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 6, md: 4, sm: 2, xs: 1, xxs: 1 }}
            rowHeight={100}
            isDraggable={isEditMode}
            isResizable={isEditMode}
            draggableCancel=".non-draggable"
        >
            {activeWidgets.map((widgetId) => (
                <div key={widgetId} className="overflow-hidden">
                    {getWidgetContent(widgetId)}
                </div>
            ))}
      </ResponsiveGridLayout>
      }
       <style jsx global>{`
        .react-grid-item.react-grid-placeholder {
          background: hsl(var(--accent)) !important;
        }
        .non-interactive .react-resizable-handle {
          display: none;
        }
      `}</style>
    </div>
  );
}

    
