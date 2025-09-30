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
import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { WidgetLibrary } from '@/components/dashboard/widget-library';
import { AssistantWidget } from '@/components/dashboard/assistant-widget';


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
  'recent-tickets': {
    title: 'Recent Tickets',
    defaultLayout: { i: 'recent-tickets', x: 0, y: 1, w: 4, h: 2, minW: 2, minH: 2 },
  },
  'new-tenants': {
    title: 'New Tenants',
    defaultLayout: { i: 'new-tenants', x: 4, y: 0, w: 2, h: 3, minW: 2, minH: 2 },
  },
  'ai-assistant': {
    title: 'AI Assistant',
    defaultLayout: { i: 'ai-assistant', x: 0, y: 3, w: 6, h: 3, minW: 3, minH: 2 },
  },
};


export default function DashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [layouts, setLayouts] = useState<{[key: string]: Layout[]}>({});
  const [activeWidgets, setActiveWidgets] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);


  useEffect(() => {
    setIsClient(true);
    let isMounted = true;

    try {
      const savedLayouts = window.localStorage.getItem('dashboard-layouts-v2');
      const savedWidgets = window.localStorage.getItem('dashboard-widgets-v2');
      
      if (savedLayouts && isMounted) setLayouts(JSON.parse(savedLayouts));
      
      if (savedWidgets && isMounted) {
        setActiveWidgets(JSON.parse(savedWidgets));
      } else {
        // Default widgets
        setActiveWidgets(['new-tickets', 'in-progress', 'total-users', 'completed', 'recent-tickets', 'new-tenants', 'ai-assistant']);
      }

    } catch (error) {
      console.error('Could not load layout from localStorage', error);
      setActiveWidgets(['new-tickets', 'in-progress', 'total-users', 'completed', 'recent-tickets', 'new-tenants', 'ai-assistant']);
    }

    const ticketQuery = query(
      collection(db, 'tickets'),
      orderBy('createdAt', 'desc')
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

    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          if (isMounted) {
            setUserCount(data.users.length);
          }
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
      unsubscribeTickets();
      unsubscribeTenants();
    };
  }, [loading]);

  const onLayoutChange = (layout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
    if (isEditMode) {
        try {
            window.localStorage.setItem('dashboard-layouts-v2', JSON.stringify(allLayouts));
            setLayouts(allLayouts);
        } catch (error) {
            console.error('Could not save layouts to localStorage', error);
        }
    }
  };

  const getTicketCountByStatus = (status: TicketStatus) => {
    return tickets.filter((ticket) => ticket.status === status).length;
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
    try {
        window.localStorage.setItem('dashboard-widgets-v2', JSON.stringify(newWidgets));
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


  const getWidgetContent = (widgetId: string) => {
    switch (widgetId) {
      case 'new-tickets':
        return (
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Tickets</CardTitle>
              <Inbox className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getTicketCountByStatus('New')}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting analyst assignment
              </p>
            </CardContent>
          </Card>
        );
      case 'in-progress':
        return (
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <GanttChartSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getTicketCountByStatus('In Progress')}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently being worked on
              </p>
            </CardContent>
          </Card>
        );
      case 'total-users':
        return (
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userCount}</div>
              <p className="text-xs text-muted-foreground">
                Across all roles
              </p>
            </CardContent>
          </Card>
        );
      case 'completed':
        return (
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getTicketCountByStatus('Completed')}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        );
      case 'recent-tickets':
        const recentTickets = tickets.slice(0, 5);
        return (
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Recent Tickets
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard/tickets">View All</Link>
                </Button>
              </CardTitle>
              <CardDescription>
                The latest 5 tickets that have been created.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>
                      <span className="sr-only">Action</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : recentTickets.length > 0 ? (
                    recentTickets.map((ticket) => (
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
                        No tickets yet.
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
                New Tenants
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard/admin/tenants">View All</Link>
                </Button>
              </CardTitle>
              <CardDescription>
                Your newest clients on the platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant Name</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>
                      <span className="sr-only">Action</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        Loading...
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
                        No tenants found.
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
    .map(id => WIDGET_DEFINITIONS[id].defaultLayout);
  
  const finalLayout = [...currentLayout, ...defaultLayoutForActive];

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
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
