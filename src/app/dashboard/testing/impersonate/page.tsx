
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
import { useRouter } from 'next/navigation';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { WidgetLibrary } from '@/components/dashboard/widget-library';
import { ClientPortalWidget } from '@/components/testing/client-portal-widget';
import { WorkflowWidget } from '@/components/testing/workflow-widget';
import { EndUserPortalWidget } from '@/components/testing/end-user-portal-widget';
import { AnalystPortalWidget } from '@/components/testing/analyst-portal-widget';


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
  'impersonation-list': {
    title: '1. Impersonate User',
    defaultLayout: { i: 'impersonation-list', x: 0, y: 0, w: 2, h: 4, minW: 2, minH: 3 },
  },
  'client-portal': {
    title: '2. Client Creates Request',
    defaultLayout: { i: 'client-portal', x: 2, y: 0, w: 2, h: 4, minW: 2, minH: 3 },
  },
  'end-user-portal': {
    title: '3. End-User Fills Form',
    defaultLayout: { i: 'end-user-portal', x: 4, y: 0, w: 2, h: 4, minW: 2, minH: 3 },
  },
  'manager-portal': {
    title: "4 & 6. Manager's Portal",
    defaultLayout: { i: 'manager-portal', x: 0, y: 4, w: 4, h: 4, minW: 3, minH: 4},
  },
  'analyst-portal': {
    title: "5. Analyst's Portal",
    defaultLayout: { i: 'analyst-portal', x: 4, y: 4, w: 2, h: 4, minW: 2, minH: 3 },
  }
};


export default function ImpersonateUserPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [impersonatingUid, setImpersonatingUid] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();

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
            return data.users;
        } catch (err: any) {
            console.error(err);
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    };
    
    // This function will create a user if they don't exist.
    const ensureUserExists = async (allUsers: User[], email: string, role: string) => {
        if (!allUsers.some(u => u.email === email)) {
            try {
                await fetch('/api/users/invite', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, role }),
                });
                return true; // Indicates a user was created
            } catch (e) {
                console.error(`Failed to create user ${email}:`, e);
                return false;
            }
        }
        return false;
    };


    useEffect(() => {
        setIsClient(true);
        let isMounted = true;

        const initialize = async () => {
            let initialUsers = await fetchUsers();
            
            if (!isMounted) return;

            // Seed essential users if they don't exist
            const createdManager = await ensureUserExists(initialUsers, 'manager@example.com', 'Manager');
            const createdAnalystA = await ensureUserExists(initialUsers, 'analyst.a@example.com', 'Analyst');
            const createdAnalystB = await ensureUserExists(initialUsers, 'analyst.b@example.com', 'Analyst');

            if (createdManager || createdAnalystA || createdAnalystB) {
                toast({ title: 'Seeding Users', description: 'Creating default Manager and Analyst users for testing.'});
                // Refetch users if we created any
                initialUsers = await fetchUsers();
            }
            
            if (isMounted) {
                setUsers(initialUsers);
            }
        };

        initialize();

        try {
            const savedLayouts = window.localStorage.getItem('testing-dashboard-layouts-v3');
            const savedWidgets = window.localStorage.getItem('testing-dashboard-widgets-v3');
            
            if (savedLayouts && isMounted) setLayouts(JSON.parse(savedLayouts));
            
            if (savedWidgets && isMounted) {
                setActiveWidgets(JSON.parse(savedWidgets));
            } else {
                setActiveWidgets(['impersonation-list', 'client-portal', 'end-user-portal', 'manager-portal', 'analyst-portal']);
            }
        } catch (error) {
            console.error('Could not load layout from localStorage', error);
            setActiveWidgets(['impersonation-list', 'client-portal', 'end-user-portal', 'manager-portal', 'analyst-portal']);
        }
        
        return () => { isMounted = false; };
    }, []);

    const onLayoutChange = (layout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
        if (isEditMode) {
            try {
                window.localStorage.setItem('testing-dashboard-layouts-v3', JSON.stringify(allLayouts));
                setLayouts(allLayouts);
            } catch (error) {
                console.error('Could not save layouts to localStorage', error);
            }
        }
    };

    const handleWidgetChange = (newWidgets: string[]) => {
        setActiveWidgets(newWidgets);
        try {
            window.localStorage.setItem('testing-dashboard-widgets-v3', JSON.stringify(newWidgets));
        } catch (error) {
            console.error('Could not save widgets to localStorage', error);
        }
    }

    const addWidget = (widgetId: string) => {
        handleWidgetChange([...activeWidgets, widgetId]);
    }

    const removeWidget = (widgetId: string) => {
        handleWidgetChange(activeWidgets.filter(id => id !== widgetId));
    };


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
    
    const isCredentialError = error && (error.includes('credential') || error.includes('FIREBASE_PROJECT_ID'));

    const getWidgetContent = (widgetId: string) => {
        switch(widgetId) {
            case 'impersonation-list':
                return (
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle>1. Impersonate User</CardTitle>
                            <CardDescription>
                            Start the workflow by impersonating a user. The other widgets will update to reflect their perspective.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto">
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
                                <TableHead>Role / Tenant</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
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
                                            <TableCell className="font-medium text-xs truncate">{user.email || 'N/A'} {auth.currentUser?.uid === user.uid && '(You)'}</TableCell>
                                            <TableCell>
                                                <Badge variant={user.role === 'End User' ? 'outline' : 'secondary'}>{user.tenantName || user.role}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                            <Button 
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleImpersonate(user.uid, user.email)}
                                                    disabled={loading || impersonatingUid === user.uid || auth.currentUser?.uid === user.uid}
                                                >
                                                    <LogIn className="mr-2 h-4 w-4" />
                                                    {impersonatingUid === user.uid ? 'Logging in...' : 'Login as'}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        </CardContent>
                    </Card>
                )
            case 'client-portal':
                return <ClientPortalWidget />
            case 'end-user-portal':
                return <EndUserPortalWidget />
            case 'manager-portal':
                return <WorkflowWidget title="4 & 6. Manager's Portal" description="Drag tickets from 'New' to an analyst's column to assign them. Drag tickets to other columns to update status." />
            case 'analyst-portal':
                return <AnalystPortalWidget />
            default:
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle>Unknown Widget</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>Widget not found: {widgetId}</p>
                        </CardContent>
                    </Card>
                );
        }
    }

    const currentLayout = (layouts.lg || []).filter(l => activeWidgets.includes(l.i));
    const defaultLayoutForActive = activeWidgets
      .filter(id => !currentLayout.some(l => l.i === id))
      .map(id => WIDGET_DEFINITIONS[id].defaultLayout);
    
    const finalLayout = [...currentLayout, ...defaultLayoutForActive];


  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Testing Dashboard</h1>
        <div className="flex items-center gap-2">
            <WidgetLibrary 
                allWidgets={WIDGET_DEFINITIONS}
                activeWidgets={activeWidgets}
                onAddWidget={addWidget}
            />
            <Button
                variant={isEditMode ? 'default' : 'outline'}
                onClick={() => setIsEditMode(!isEditMode)}
                className={isEditMode ? 'bg-accent hover:bg-accent/90' : ''}
            >
                <LayoutDashboard className="mr-2" />
                {isEditMode ? 'Done Editing' : 'Edit Dashboard'}
            </Button>
        </div>
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
            <div key={widgetId} className="overflow-hidden relative group/widget">
                {isEditMode && (
                    <Button 
                        variant="destructive" 
                        size="icon" 
                        className="absolute top-2 right-2 z-10 h-6 w-6 opacity-0 group-hover/widget:opacity-100 transition-opacity"
                        onClick={() => removeWidget(widgetId)}
                    >
                        <span className="sr-only">Remove widget</span>
                        &times;
                    </Button>
                )}
                <div className={`h-full ${!isEditMode ? 'non-draggable' : ''}`}>
                    {getWidgetContent(widgetId)}
                </div>
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
