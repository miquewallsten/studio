
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

type Request = {
  id: string;
  subjectName: string;
  reportType: string;
  status: string;
  createdAt: string; // Will be an ISO string
};

export default function ClientDashboardPage() {
  const [user, loadingUser] = useAuthState(auth);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const secureFetch = useSecureFetch();

  useEffect(() => {
    if (user) {
      const fetchRequests = async () => {
        try {
          setLoading(true);
          const data = await secureFetch('/api/client/tickets');
          if (data.error) {
            throw new Error(data.error);
          }
          setRequests(data.tickets);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchRequests();
    } else if (!loadingUser) {
        setLoading(false);
    }
  }, [user, loadingUser, secureFetch]);

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Client Portal</h1>
        <Button asChild className="bg-accent hover:bg-accent/90">
          <Link href="/client/request/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Request
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Requests</CardTitle>
          <CardDescription>
            Here is a list of your recent background check requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    You have no active requests.
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.subjectName}
                    </TableCell>
                    <TableCell>{request.reportType}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          request.status === 'New' ? 'destructive' : 'secondary'
                        }
                      >
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(request.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="icon">
                        {/* This page does not exist yet, but is the correct logical link */}
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
        </CardContent>
      </Card>
    </div>
  );
}
