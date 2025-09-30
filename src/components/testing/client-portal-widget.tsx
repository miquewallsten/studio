
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
import { ArrowRight, PlusCircle, UserCircle, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import Link from 'next/link';

type Request = {
  id: string;
  subjectName: string;
  reportType: string;
  status: string;
  createdAt: Timestamp;
};

export function ClientPortalWidget() {
  const [user, loadingUser] = useAuthState(auth);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (user) {
      const q = query(
        collection(db, 'tickets'),
        where('clientId', '==', user.uid)
      );
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const requestsData: Request[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            requestsData.push({
              id: doc.id,
              subjectName: data.subjectName,
              reportType: data.reportType,
              status: data.status,
              createdAt: data.createdAt,
            });
          });
          setRequests(requestsData.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching client requests:', error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } else {
      setRequests([]); // Clear requests if no user is impersonated
      setLoading(false);
    }
  }, [user]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'New': return 'destructive';
      case 'Completed': return 'default';
      default: return 'secondary';
    }
  };

  const renderContent = () => {
    if (loadingUser || loading) {
        return (
             <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">Loading Client Data...</p>
            </div>
        )
    }

    if (!user) {
      return (
        <div className="flex items-center justify-center h-full text-center p-4">
            <div>
                <UserCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">
                    No client impersonated.
                </p>
                <p className="text-xs text-muted-foreground">
                    Use the 'Impersonate User' widget to log in as a client.
                </p>
            </div>
        </div>
      );
    }
    return (
      <>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Subject</TableHead>
              <TableHead className="text-xs">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center text-sm">
                  No requests found for this client.
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium text-xs py-2">
                    {request.subjectName}
                  </TableCell>
                  <TableCell className="py-2">
                    <Badge variant={getStatusVariant(request.status)} className="text-xs">
                      {request.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </>
    );
  };

  return (
    <Card className="h-full flex flex-col non-draggable">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>2. Client Portal</CardTitle>
            <CardDescription className="text-xs">
              {user ? `Viewing as: ${user.email}` : 'Impersonate a client to begin.'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" disabled={!user}>
              <Link href="/client/dashboard" target="_blank">
                <ExternalLink className="mr-2" /> View Full Portal
              </Link>
            </Button>
            <Button variant="outline" size="sm" disabled={!user}>
                <PlusCircle className="mr-2" /> New Request
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-2">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
