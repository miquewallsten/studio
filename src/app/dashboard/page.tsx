import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-4">
      <h1 className="text-3xl font-bold font-headline">Dashboard</h1>

      <Card>
        <CardHeader>
          <CardTitle>Welcome to TenantCheck</CardTitle>
          <CardDescription>
            This is your main dashboard. Key metrics and summaries will be displayed here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed">
            <p className="text-muted-foreground">Dashboard widgets and analytics will be available here soon.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
