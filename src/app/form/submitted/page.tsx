
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function FormSubmittedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader className="items-center">
            <div className="rounded-full bg-green-100 p-3 text-green-600">
                 <CheckCircle className="h-8 w-8" />
            </div>
          <CardTitle className="font-headline text-2xl pt-4">Thank You!</CardTitle>
          <CardDescription>
            Your information has been successfully submitted. Our team will now
            begin the review process. You may now close this window.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Button variant="outline" asChild>
                <Link href="/client/login">Return to Login</Link>
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
