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
      <h1 className="text-3xl font-bold font-headline">User & Tenant Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>Users and Tenants</CardTitle>
          <CardDescription>
            Manage internal users and client tenants. All users must be authenticated through Firebase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed">
            <p className="text-muted-foreground">User and tenant list will be displayed here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
