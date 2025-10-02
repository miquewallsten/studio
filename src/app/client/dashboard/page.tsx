'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PlusCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useSecureFetch } from '@/hooks/use-secure-fetch';
import type { Timestamp } from 'firebase/firestore';
import { useAuthRole } from '@/hooks/use-auth-role';
import { Skeleton } from '@/components/ui/skeleton';

type Ticket = {
  id: string;
  subjectName: string;
  reportType: string;
  status: string;
  createdAt: string; // Will be an ISO string
};

const getStatusVariant = (status: string) => {
    switch (status) {
      case 'New': return 'destructive';
      case 'In Progress': return 'secondary';
      case 'Completed': return 'default';
      default: return 'outline';
    }
  }

function TenantDashboard() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const secureFetch = useSecureFetch();

    useEffect(() => {
        const fetchRequests = async () => {
            try {
            setLoading(true);
            const data = await secureFetch('/api/client/tickets');
            if (data.error) {
                throw new Error(data.error);
            }
            setTickets(data.tickets);
            } catch (err: any) {
            setError(err.message);
            } finally {
            setLoading(false);
            }
        };

        fetchRequests();
    }, [secureFetch]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-headline">Client Dashboard</h1>
                <Button asChild className="bg-accent hover:bg-accent/90">
                <Link href="/client/request/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Request
                </Link>
                </Button>
            </div>
             <Card>
                <CardHeader>
                <CardTitle>My Organization's Requests</CardTitle>
                <CardDescription>
                    Here is a list of recent background check requests from your organization.
                </CardDescription>
                </CardHeader>
                <CardContent>
                    <RequestTable loading={loading} error={error} tickets={tickets} />
                </CardContent>
            </Card>
        </div>
    );
}

function EndUserDashboard() {
     const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const secureFetch = useSecureFetch();

    useEffect(() => {
        const fetchRequests = async () => {
            try {
            setLoading(true);
            const data = await secureFetch('/api/end-user/tickets');
            if (data.error) {
                throw new Error(data.error);
            }
            setTickets(data.tickets);
            } catch (err: any) {
            setError(err.message);
            } finally {
            setLoading(false);
            }
        };

        fetchRequests();
    }, [secureFetch]);

    return (
        <div className="space-y-4">
            <h1 className="text-3xl font-bold font-headline">My Portal</h1>
             <Card>
                <CardHeader>
                <CardTitle>My History</CardTitle>
                <CardDescription>
                    Here is a list of background checks where you are the subject.
                </CardDescription>
                </CardHeader>
                <CardContent>
                    <RequestTable loading={loading} error={error} tickets={tickets} />
                </CardContent>
            </Card>
        </div>
    );
}


function RequestTable({loading, error, tickets}: {loading: boolean, error: string | null, tickets: Ticket[]}) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Report Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>
                    <span className="sr-only">Actions</span>
                </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                    Loading requests...
                    </TableCell>
                </TableRow>
                ) : error ? (
                    <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-destructive">
                        Error: {error}
                    </TableCell>
                    </TableRow>
                ) : tickets.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                    No requests found.
                    </TableCell>
                </TableRow>
                ) : (
                tickets.map((request) => (
                    <TableRow key={request.id}>
                    <TableCell className="font-medium">
                        {request.subjectName}
                    </TableCell>
                    <TableCell>{request.reportType}</TableCell>
                    <TableCell>
                        <Badge
                        variant={getStatusVariant(request.status)}
                        >
                        {request.status}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        {new Date(request.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                        <Button asChild variant="ghost" size="icon">
                        <Link href={`/client/ticket/${request.id}`}>
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                        </Button>
                    </TableCell>
                    </TableRow>
                ))
                )}
            </TableBody>
        </Table>
    )
}


export default function ClientDashboardPage() {
  const { role, isLoading: isRoleLoading } = useAuthRole();
  
  if (isRoleLoading) {
      return (
          <div className="space-y-4">
              <Skeleton className="h-9 w-1/4" />
              <Card>
                  <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                  <CardContent><Skeleton className="h-40 w-full" /></CardContent>
              </Card>
          </div>
      )
  }

  if (role === 'Tenant Admin' || role === 'Tenant User') {
    return <TenantDashboard />;
  }

  if (role === 'End User') {
    return <EndUserDashboard />;
  }

  return (
      <div className="space-y-4">
            <h1 className="text-3xl font-bold font-headline">Client Portal</h1>
             <Card>
                <CardHeader>
                <CardTitle>Welcome</CardTitle>
                <CardDescription>
                   There is no portal content for your assigned role.
                </CardDescription>
                </CardHeader>
            </Card>
      </div>
  )

}