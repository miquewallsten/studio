import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function AdminSettingsPage() {
  return (
    <div className="flex-1 space-y-4">
      <h1 className="text-3xl font-bold font-headline">System Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Manage system-wide settings, tags, and client tenants.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed">
            <p className="text-muted-foreground">System settings and tag management will be here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
