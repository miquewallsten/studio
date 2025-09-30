import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function ClientDashboardPage() {
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
          <p>You have no active requests.</p>
        </CardContent>
      </Card>
    </div>
  );
}
