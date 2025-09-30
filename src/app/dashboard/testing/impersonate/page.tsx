
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { InvitationInboxWidget } from '@/components/testing/invitation-inbox-widget';
import { MobileEndUserPortalWidget } from '@/components/testing/mobile-end-user-portal-widget';


const ResponsiveGridLayout = WidthProvider(Responsive);

type User = {
    uid: string;
    email?: string;
    role: string;
    tenantName: string | null;
}

const WIDGET_DEFINITIONS: {
    [key: string]: { title: string; defaultLayout: Layout };
  } = {
    'client-portal': {
      title: 'Client Portal',
      defaultLayout: { i: 'client-portal', x: 0, y: 0, w: 2, h: 3, minW: 2, minH: 3 },
    },
    'invitation-inbox': {
      title: 'Invitation Inbox',
      defaultLayout: { i: 'invitation-inbox', x: 2, y: 0, w: 2, h: 3, minW: 2, minH: 2 },
    },
    'end-user-portal': {
      title: 'End-User Portal',
      defaultLayout: { i: 'end-user-portal', x: 0, y: 3, w: 2, h: 3, minW: 2, minH: 3 },
    },
    'mobile-end-user-portal': {
      title: 'Mobile End-User Portal',
      defaultLayout: { i: 'mobile-end-user-portal', x: 2, y: 3, w: 1, h: 4, minW: 1, minH: 4 },
    },
    'workflow': {
        title: 'Manager\'s Workflow',
        defaultLayout: { i: 'workflow', x: 3, y: 3, w: 3, h: 4, minW: 2, minH: 3 },
    },
    'analyst-portal': {
        title: 'Analyst Portal',
        defaultLayout: { i: 'analyst-portal', x: 4, y: 0, w: 2, h: 3, minW: 2, minH: 3 },
    }
  };


export default function ImpersonateUserPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [impersonatingUid, setImpersonatingUid] = useState<string | null>(null);
    const { toast } = useToast();

    const [isEditMode, setIsEditMode] = useState(false);
    const [layouts, setLayouts] = useState<{[key: string]: Layout[]}>({});
    const [activeWidgets, setActiveWidgets] = useState<string[]>([]);
    const [isClient, setIsClient] = useState(false);

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
        let isMounted = true;

        const initialize = async () => {
            let initialUsers = await fetchUsers();
            if (!isMounted) return;

            const createdManager = await ensureUserExists(initialUsers, 'manager@example.com', 'Manager');
            const createdAnalystA = await ensureUserExists(initialUsers, 'analyst.a@example.com', 'Analyst');
            const createdAnalystB = await ensureUserExists(initialUsers, 'analyst.b@example.com', 'Analyst');

            if (createdManager || createdAnalystA || createdAnalystB) {
                toast({ title: 'Seeding Users', description: 'Default Manager and Analyst users have been created for testing.'});
                initialUsers = await fetchUsers(); 
            }
            
            if (isMounted) {
                setUsers(initialUsers);
            }
        };

        initialize();

        // Load layout from localStorage
        setIsClient(true);
        try {
            const savedLayouts = window.localStorage.getItem('testing-dashboard-layouts-v2');
            if (savedLayouts && isMounted) setLayouts(JSON.parse(savedLayouts));
            
            const savedWidgets = window.localStorage.getItem('testing-dashboard-widgets-v2');
            if (savedWidgets && isMounted) {
                setActiveWidgets(JSON.parse(savedWidgets));
            } else {
                 // For now, all widgets are active by default
                setActiveWidgets(['client-portal', 'invitation-inbox', 'end-user-portal', 'workflow', 'analyst-portal', 'mobile-end-user-portal']);
            }
        } catch (error) {
            console.error('Could not load layout from localStorage', error);
            setActiveWidgets(['client-portal', 'invitation-inbox', 'end-user-portal', 'workflow', 'analyst-portal', 'mobile-end-user-portal']);
        }


        return () => { isMounted = false; };
    }, []);


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
            
            await auth.signOut();
            await signInWithCustomToken(auth, data.customToken);

            toast({
                title: 'Impersonation Started',
                description: `You are now logged in as ${targetEmail || 'user'}.`,
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

    const onLayoutChange = (layout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
        if (isEditMode) {
            try {
                window.localStorage.setItem('testing-dashboard-layouts-v2', JSON.stringify(allLayouts));
                setLayouts(allLayouts);
            } catch (error) {
                console.error('Could not save layouts to localStorage', error);
            }
        }
    };

    const handleRefreshUsers = () => {
      fetchUsers().then(setUsers);
    }
    
    const clientUsers = users.filter(u => u.role === 'End User' && u.tenantName);
    const endUsers = users.filter(u => u.role === 'End User'); // All end users for all portals
    const analystUsers = users.filter(u => u.role === 'Analyst');

    const currentLayout = (layouts.lg || []).filter(l => activeWidgets.includes(l.i));
    const defaultLayoutForActive = activeWidgets
      .filter(id => !currentLayout.some(l => l.i === id))
      .map(id => WIDGET_DEFINITIONS[id].defaultLayout);
    
    const finalLayout = [...currentLayout, ...defaultLayoutForActive];
    
    const getWidgetContent = (widgetId: string) => {
        switch(widgetId) {
            case 'client-portal':
                return <ClientPortalWidget 
                    users={clientUsers}
                    onImpersonate={handleImpersonate}
                    onUserCreated={handleRefreshUsers}
                    isImpersonating={!!impersonatingUid}
                />
            case 'invitation-inbox':
                return <InvitationInboxWidget
                    onImpersonate={handleImpersonate}
                    isImpersonating={!!impersonatingUid}
                />
            case 'end-user-portal':
                return <EndUserPortalWidget 
                    users={endUsers}
                    onImpersonate={handleImpersonate}
                    isImpersonating={!!impersonatingUid}
                />
            case 'mobile-end-user-portal':
                return <MobileEndUserPortalWidget />
            case 'workflow':
                return <WorkflowWidget 
                    analysts={analystUsers}
                />
            case 'analyst-portal':
                return <AnalystPortalWidget 
                    users={analystUsers}
                    onImpersonate={handleImpersonate}
                    isImpersonating={!!impersonatingUid}
                />
            default:
                return null;
        }
    }


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
      
      {error && (
        <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
                {error}
                {error.includes('credential') && (
                    <p className="mt-2">Please ensure your server-side Firebase Admin credentials are correctly set in your `.env` file.</p>
                )}
            </AlertDescription>
        </Alert>
    )}
    {isClient && 
        <ResponsiveGridLayout
            className={`layout ${!isEditMode ? 'non-interactive' : ''}`}
            layouts={layouts}
            layout={finalLayout}
            onLayoutChange={onLayoutChange}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 6, md: 4, sm: 2, xs: 1, xxs: 1 }}
            rowHeight={150}
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
          opacity: 0.2;
          border-radius: var(--radius);
        }
        .non-interactive .react-resizable-handle {
          display: none;
        }
      `}</style>
    </div>
  );
}
