import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function AdminUsersPage() {
  return (
    <div className="flex-1 space-y-4">
      <h1 className="text-3xl font-bold font-headline">User Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage internal users (analysts, managers) and clients.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed">
            <p className="text-muted-foreground">User and client list will be displayed here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
