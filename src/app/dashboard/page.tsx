
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
import {
  ArrowRight,
  Inbox,
  GanttChartSquare,
  CheckCircle,
  Users,
  LayoutDashboard,
  Bot,
} from 'lucide-react';
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  Timestamp,
  doc,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { WidgetLibrary } from '@/components/dashboard/widget-library';
import { AssistantWidget } from '@/components/dashboard/assistant-widget';
import { NotificationsWidget } from '@/components/dashboard/notifications-widget';
import { useLanguage } from '@/contexts/language-context';
import { useSecureFetch } from '@/hooks/use-secure-fetch';
import { debounce } from 'lodash';
import { QuickActionsWidget } from '@/components/dashboard/quick-actions-widget';
import { chat } from '@/ai/flows/assistant-flow';
import { CustomerExperienceWidget } from '@/components/dashboard/customer-experience-widget';

const ResponsiveGridLayout = WidthProvider(Responsive);

type Ticket = {
  id: string;
  subjectName: string;
  reportType: string;
  status: string;
  createdAt: Timestamp;
};

type Tenant = {
  id: string;
  name: string;
  createdAt: Timestamp;
};

type TicketStatus = 'New' | 'In Progress' | 'Pending Review' | 'Completed';

const WIDGET_DEFINITIONS: {
  [key: string]: { title: string; defaultLayout: Layout };
} = {
  'notifications': {
    title: 'Notifications',
    defaultLayout: { i: 'notifications', x: 4, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
  },
  'customer-experience': {
    title: 'Customer Experience',
    defaultLayout: { i: 'customer-experience', x: 0, y: 3, w: 6, h: 3, minW: 3, minH: 3 },
  },
  'new-tickets': {
    title: 'New Tickets',
    defaultLayout: { i: 'new-tickets', x: 0, y: 0, w: 1, h: 1, minW: 1, minH: 1 },
  },
  'in-progress': {
    title: 'In Progress',
    defaultLayout: { i: 'in-progress', x: 1, y: 0, w: 1, h: 1, minW: 1, minH: 1 },
  },
  'total-users': {
    title: 'Total Users',
    defaultLayout: { i: 'total-users', x: 2, y: 0, w: 1, h: 1, minW: 1, minH: 1 },
  },
  completed: {
    title: 'Completed',
    defaultLayout: { i: 'completed', x: 3, y: 0, w: 1, h: 1, minW: 1, minH: 1 },
  },
  'quick-actions': {
    title: 'Quick Actions',
    defaultLayout: { i: 'quick-actions', x: 0, y: 1, w: 2, h: 2, minW: 2, minH: 2 },
  },
  'recent-tickets': {
    title: 'Recent Tickets',
    defaultLayout: { i: 'recent-tickets', x: 2, y: 1, w: 4, h: 2, minW: 2, minH: 2 },
  },
  'new-tenants': {
    title: 'New Tenants',
    defaultLayout: { i: 'new-tenants', x: 4, y: 3, w: 2, h: 2, minW: 2, minH: 2 },
  },
  'ai-assistant': {
    title: 'AI Assistant',
    defaultLayout: { i: 'ai-assistant', x: 0, y: 5, w: 6, h: 3, minW: 3, minH: 3 },
  },
};

const DEFAULT_WIDGETS = ['notifications', 'new-tickets', 'in-progress', 'total-users', 'completed', 'quick-actions', 'recent-tickets', 'new-tenants', 'customer-experience', 'ai-assistant'];


export default function DashboardPage() {
  const { t, locale } = useLanguage();
  const [user, loadingUser] = useAuthState(auth);
  const secureFetch = useSecureFetch();
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [ticketMetrics, setTicketMetrics] = useState({ New: 0, 'In Progress': 0, Completed: 0 });
  const [loading, setLoading] = useState(true);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [layouts, setLayouts] = useState<{[key: string]: Layout[]}>({});
  const [activeWidgets, setActiveWidgets] = useState<string[]>(DEFAULT_WIDGETS);
  const [isClient, setIsClient] = useState(false);
  
  const hasLoadedPrefs = useRef(false);
  const hasSeeded = useRef(false);

  // Debounced save function
  const savePreferences = useCallback(debounce(async (prefs: { layouts?: any, widgets?: any }) => {
    if (!hasLoadedPrefs.current || !auth.currentUser) return;
    try {
      await secureFetch('/api/user/preferences', {
        method: 'POST',
        body: JSON.stringify({ dashboard: prefs }),
      }); // No JSON expected back, so we don't await the result directly
    } catch (e) {
      console.error('Failed to save preferences', e);
    }
  }, 1000), [secureFetch]);


  useEffect(() => {
    setIsClient(true);
    let isMounted = true;

    // Fetch user preferences
    if (user) {
      const fetchPrefs = async () => {
        try {
          const data = await secureFetch('/api/user/preferences');
          if (isMounted) {
            if (data.dashboard?.layouts) setLayouts(data.dashboard.layouts);
            if (data.dashboard?.widgets) setActiveWidgets(data.dashboard.widgets);
          }
        } catch (e) {
          console.log('No saved preferences found, using defaults.');
          setActiveWidgets(DEFAULT_WIDGETS);
        } finally {
            if(isMounted) hasLoadedPrefs.current = true;
        }
      };
      fetchPrefs();
    }


    const ticketQuery = query(
      collection(db, 'tickets'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const tenantQuery = query(
      collection(db, 'tenants'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribeTickets = onSnapshot(ticketQuery, (snapshot) => {
      if (!isMounted) return;
      const ticketsData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Ticket)
      );
      setTickets(ticketsData);
      if (loading) setLoading(false);
    });

    const unsubscribeTenants = onSnapshot(tenantQuery, (snapshot) => {
      if (!isMounted) return;
      const tenantsData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Tenant)
      );
      setTenants(tenantsData);
    });

    const fetchUsersAndMetrics = async () => {
        try {
          // Use the AI assistant itself to get the initial stats.
          const response = await chat({ prompt: 'Give me the latest platform metrics.', locale });
          // In a real app, you'd parse this more robustly, but for now, we assume a simple format.
          // A better approach would be for the flow to return structured JSON, but for a simple query, this is fine.
          const userCountMatch = response.match(/(\d+) total users/i);
          if (userCountMatch && isMounted) {
            setUserCount(parseInt(userCountMatch[1], 10));
          }
          
          const newTicketsMatch = response.match(/New: (\d+)/i);
          const inProgressMatch = response.match(/In Progress: (\d+)/i);
          const completedMatch = response.match(/Completed: (\d+)/i);
  
          if (isMounted) {
            setTicketMetrics({
                New: newTicketsMatch ? parseInt(newTicketsMatch[1], 10) : 0,
                'In Progress': inProgressMatch ? parseInt(inProgressMatch[1], 10) : 0,
                Completed: completedMatch ? parseInt(completedMatch[1], 10) : 0,
            });
          }
        } catch (error) {
          console.error('Failed to fetch users and metrics via AI:', error);
        }
      };
  
      fetchUsersAndMetrics();

    return () => {
      isMounted = false;
      unsubscribeTickets();
      unsubscribeTenants();
      savePreferences.cancel();
    };
  }, [user, loading, savePreferences, locale, secureFetch]);

  const onLayoutChange = (currentLayout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
    if (isEditMode && hasLoadedPrefs.current) {
        setLayouts(allLayouts);
        savePreferences({ layouts: allLayouts, widgets: activeWidgets });
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'New':
        return 'destructive';
      case 'Completed':
        return 'default';
      default:
        return 'secondary';
    }
  };
  
  const handleWidgetChange = (newWidgets: string[]) => {
    setActiveWidgets(newWidgets);
    savePreferences({ layouts, widgets: newWidgets });
  }

  const addWidget = (widgetId: string) => {
    handleWidgetChange([...activeWidgets, widgetId]);
  }

  const removeWidget = (widgetId: string) => {
    handleWidgetChange(activeWidgets.filter(id => id !== widgetId));
  };


  const getWidgetContent = (widgetId: string) => {
    switch (widgetId) {
      case 'notifications':
        return <NotificationsWidget />;
      case 'customer-experience':
        return <CustomerExperienceWidget />;
      case 'new-tickets':
        return (
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.new_tickets')}</CardTitle>
              <Inbox className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {ticketMetrics.New}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.new_tickets_desc')}
              </p>
            </CardContent>
          </Card>
        );
      case 'in-progress':
        return (
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.in_progress')}</CardTitle>
              <GanttChartSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {ticketMetrics['In Progress']}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.in_progress_desc')}
              </p>
            </CardContent>
          </Card>
        );
      case 'total-users':
        return (
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.total_users')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userCount}</div>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.total_users_desc')}
              </p>
            </CardContent>
          </Card>
        );
      case 'completed':
        return (
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.completed')}</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {ticketMetrics.Completed}
              </div>
              <p className="text-xs text-muted-foreground">{t('dashboard.completed_desc')}</p>
            </CardContent>
          </Card>
        );
      case 'quick-actions':
        return <QuickActionsWidget />;
      case 'recent-tickets':
        return (
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {t('dashboard.recent_tickets')}
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard/tickets">{t('common.view_all')}</Link>
                </Button>
              </CardTitle>
              <CardDescription>
                {t('dashboard.recent_tickets_desc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.subject')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead>{t('common.date')}</TableHead>
                    <TableHead>
                      <span className="sr-only">{t('common.action')}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        {t('common.loading')}...
                      </TableCell>
                    </TableRow>
                  ) : tickets.length > 0 ? (
                    tickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium">
                          {ticket.subjectName}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(ticket.status)}>
                            {ticket.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {ticket.createdAt?.toDate().toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="ghost" size="icon">
                            <Link href={`/dashboard/tickets/${ticket.id}`}>
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        {t('dashboard.no_tickets_yet')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      case 'new-tenants':
        return (
            <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {t('dashboard.new_tenants')}
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard/admin/tenants">{t('common.view_all')}</Link>
                </Button>
              </CardTitle>
              <CardDescription>
                {t('dashboard.new_tenants_desc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.tenant_name')}</TableHead>
                    <TableHead>{t('common.created')}</TableHead>
                    <TableHead>
                      <span className="sr-only">{t('common.action')}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        {t('common.loading')}...
                      </TableCell>
                    </TableRow>
                  ) : tenants.length > 0 ? (
                    tenants.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell className="font-medium">
                          {tenant.name}
                        </TableCell>
                        <TableCell>
                          {tenant.createdAt
                            ? format(tenant.createdAt.toDate(), 'PPP')
                            : ''}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="ghost" size="icon">
                            <Link
                              href={`/dashboard/admin/tenants/${tenant.id}`}
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        {t('dashboard.no_tenants_found')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
        case 'ai-assistant':
            return <AssistantWidget />;
      default:
        return null;
    }
  };

  const currentLayout = (layouts.lg || []).filter(l => activeWidgets.includes(l.i));
  const defaultLayoutForActive = activeWidgets
    .filter(id => !currentLayout.some(l => l.i === id))
    .map(id => WIDGET_DEFINITIONS[id]?.defaultLayout)
    .filter(Boolean) as Layout[];
  
  const finalLayout = [...currentLayout, ...defaultLayoutForActive];

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">{t('dashboard.title')}</h1>
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
                {isEditMode ? t('dashboard.done_editing') : t('dashboard.edit_dashboard')}
            </Button>
        </div>
      </div>
      {isClient && 
        <ResponsiveGridLayout
            className={`layout ${!isEditMode ? 'non-interactive' : ''}`}
            layouts={layouts}
            onLayoutChange={onLayoutChange}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 6, md: 4, sm: 2, xs: 1, xxs: 1 }}
            rowHeight={150}
            isDraggable={isEditMode}
            isResizable={isEditMode}
            draggableCancel=".non-draggable"
        >
            {activeWidgets.map((widgetId) => (
                <div key={widgetId} className="group/widget relative">
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
                    <div className="h-full">
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
        .layout.non-interactive .react-grid-item {
            cursor: default !important;
        }
      `}</style>
    </div>
  );
}
