
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
  Users,
  Ticket
} from 'lucide-react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useSecureFetch } from '@/hooks/use-secure-fetch';

type Ticket = {
  id: string;
  subjectName: string;
  reportType: string;
  status: string;
  createdAt: string;
};

export default function TenantDashboardPage() {
  const [user, loadingUser] = useAuthState(auth);
  const secureFetch = useSecureFetch();
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
        const fetchTenantData = async () => {
            try {
                setLoading(true);
                const [ticketRes, userRes] = await Promise.all([
                    secureFetch('/api/client/tickets'),
                    secureFetch('/api/users')
                ]);

                const ticketData = await ticketRes.json();
                const userData = await userRes.json();

                if (ticketData.error) throw new Error(ticketData.error);
                if (userData.error) throw new Error(userData.error);

                setTickets(ticketData.tickets || []);
                setUserCount(userData.users?.length || 0);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchTenantData();
    }
  }, [user, secureFetch]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'New': return 'destructive';
      case 'Completed': return 'default';
      default: return 'secondary';
    }
  };
  
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">My Dashboard</h1>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Tickets</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : tickets.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Total requests created
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : userCount}</div>
              <p className="text-xs text-muted-foreground">
                Users in your organization
              </p>
            </CardContent>
          </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Recent Tickets
            <Button asChild variant="ghost" size="sm">
              <Link href="/client/dashboard">View in Client Portal</Link>
            </Button>
          </CardTitle>
          <CardDescription>
            The 5 most recent tickets created by your organization.
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
              ) : error ? (
                 <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-destructive">
                    Error: {error}
                  </TableCell>
                </TableRow>
              ) : tickets.length > 0 ? (
                tickets.slice(0, 5).map((ticket) => (
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
                      {new Date(ticket.createdAt).toLocaleDateString()}
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
  );
}
