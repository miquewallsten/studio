import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
  import { CreditCard } from 'lucide-react';
  
  export default function BillingPage() {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Billing</CardTitle>
          <CardDescription>
            Manage your payment methods and view your invoice history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-md border border-dashed">
            <div className="text-center text-muted-foreground">
              <CreditCard className="mx-auto mb-2 h-10 w-10" />
              <p>Billing features are under construction.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  