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
import { ArrowRight, Inbox, GanttChartSquare, CheckCircle, Users } from 'lucide-react';
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
import { Responsive, WidthProvider } from 'react-grid-layout';

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

export default function DashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
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
            console.error("Failed to fetch users:", error);
        }
    }
    
    fetchUsers();

    return () => {
      isMounted = false;
      unsubscribeTickets();
      unsubscribeTenants();
    };
  }, [loading]);

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

  const recentTickets = tickets.slice(0, 5);

  const layouts = {
    lg: [
      { i: 'new-tickets', x: 0, y: 0, w: 1, h: 1 },
      { i: 'in-progress', x: 1, y: 0, w: 1, h: 1 },
      { i: 'total-users', x: 2, y: 0, w: 1, h: 1 },
      { i: 'completed', x: 3, y: 0, w: 1, h: 1 },
      { i: 'recent-tickets', x: 0, y: 1, w: 4, h: 2 },
      { i: 'new-tenants', x: 4, y: 0, w: 2, h: 3 },
    ],
  };

  return (
    <div className="flex-1 space-y-4">
      <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 6, md: 4, sm: 2, xs: 1, xxs: 1 }}
        rowHeight={150}
        isDraggable
        isResizable
      >
        <div key="new-tickets" className="overflow-hidden">
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
        </div>
        <div key="in-progress" className="overflow-hidden">
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
        </div>
        <div key="total-users" className="overflow-hidden">
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
        </div>
        <div key="completed" className="overflow-hidden">
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
        </div>
        <div key="recent-tickets" className="overflow-hidden">
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
        </div>
        <div key="new-tenants" className="overflow-hidden">
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
        </div>
      </ResponsiveGridLayout>
    </div>
  );
}
