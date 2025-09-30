import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function ClientDashboardPage() {
  return (
    <div className="flex-1 space-y-4">
      <h1 className="text-3xl font-bold font-headline">Client Portal</h1>
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
