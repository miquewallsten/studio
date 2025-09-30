
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
import { LogIn, AlertCircle, LayoutDashboard, Workflow } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { auth } from '@/lib/firebase';
import { signInWithCustomToken } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { WidgetLibrary } from '@/components/dashboard/widget-library';

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
    title: 'Impersonation',
    defaultLayout: { i: 'impersonation-list', x: 0, y: 0, w: 4, h: 3, minW: 3, minH: 2 },
  },
  'workflow-overview': {
    title: 'Workflow Overview',
    defaultLayout: { i: 'workflow-overview', x: 4, y: 0, w: 2, h: 3, minW: 2, minH: 2 },
  },
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

    useEffect(() => {
        setIsClient(true);
        let isMounted = true;

        try {
            const savedLayouts = window.localStorage.getItem('testing-dashboard-layouts');
            const savedWidgets = window.localStorage.getItem('testing-dashboard-widgets');
            
            if (savedLayouts && isMounted) setLayouts(JSON.parse(savedLayouts));
            
            if (savedWidgets && isMounted) {
                setActiveWidgets(JSON.parse(savedWidgets));
            } else {
                setActiveWidgets(['impersonation-list', 'workflow-overview']);
            }
        } catch (error) {
            console.error('Could not load layout from localStorage', error);
            setActiveWidgets(['impersonation-list', 'workflow-overview']);
        }
        
        const fetchUsers = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch('/api/users');
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch users');
                }
                if(isMounted) {
                    setUsers(data.users);
                }
            } catch (err: any) {
                console.error(err);
                if (isMounted) {
                    setError(err.message);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchUsers();

        return () => { isMounted = false; };
    }, []);

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

    const handleWidgetChange = (newWidgets: string[]) => {
        setActiveWidgets(newWidgets);
        try {
            window.localStorage.setItem('testing-dashboard-widgets', JSON.stringify(newWidgets));
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
            
            router.push('/dashboard');

        } catch (err: any) {
            toast({
                title: 'Impersonation Failed',
                description: err.message,
                variant: 'destructive',
            });
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
                            <CardTitle>Impersonate User</CardTitle>
                            <CardDescription>
                            Select a user to temporarily log in as them to test their permissions and perspective.
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
                                <TableHead>Role</TableHead>
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
                                            <TableCell className="font-medium text-xs">{user.email || 'N/A'} {auth.currentUser?.uid === user.uid && '(You)'}</TableCell>
                                            <TableCell>
                                                <Badge variant={user.role === 'Unassigned' ? 'destructive' : 'secondary'}>{user.role}</Badge>
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
            case 'workflow-overview':
                return (
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Workflow Simulator</CardTitle>
                            <CardDescription>
                                An interactive overview of the entire application workflow.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex h-48 items-center justify-center rounded-md border-2 border-dashed">
                                <p className="text-muted-foreground flex items-center gap-2"><Workflow /> Mini-app widgets coming soon.</p>
                            </div>
                        </CardContent>
                    </Card>
                )
            default:
                return null;
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
            rowHeight={150}
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

