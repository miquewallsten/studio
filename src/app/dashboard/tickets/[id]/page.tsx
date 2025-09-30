import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
  } from '@/components/ui/card';
  import { Badge } from '@/components/ui/badge';
  import { Separator } from '@/components/ui/separator';
  import { Button } from '@/components/ui/button';
  import { FileUp, MessageSquare, UserPlus } from 'lucide-react';
  
  export default function TicketDetailPage({ params }: { params: { id: string } }) {
    // In a real app, you would fetch ticket data from a database using params.id
    const ticket = {
      id: params.id,
      subject: '',
      reportType: '',
      status: '',
      createdAt: '',
      description: '',
      email: '',
      client: '',
    };
  
    return (
      <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="grid gap-1">
                  <CardTitle className="text-2xl font-headline">
                    Ticket #{ticket.id}
                  </CardTitle>
                  <CardDescription>
                    {ticket.createdAt && ticket.client ? `Created on ${ticket.createdAt} by ${ticket.client}` : 'Loading ticket details...'}
                  </CardDescription>
                </div>
                {ticket.status && <Badge className="text-sm" variant={ticket.status === 'New' ? 'destructive' : 'secondary'}>
                  {ticket.status}
                </Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Subject</h3>
                  <p className="text-muted-foreground">{ticket.subject || '...'}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Report Type</h3>
                  <p className="text-muted-foreground">{ticket.reportType || '...'}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Description & Notes</h3>
                  <p className="text-muted-foreground">{ticket.description || '...'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Activity Feed</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex h-40 items-center justify-center rounded-md border border-dashed">
                    <p className="text-sm text-muted-foreground flex items-center gap-2"><MessageSquare className="size-4"/> No activity yet.</p>
                </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analyst Actions</CardTitle>
              <CardDescription>
                For internal use by managers and analysts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button className="w-full" variant="outline">
                    <UserPlus className="mr-2 size-4" /> Assign Analyst
                </Button>
                <Button className="w-full">
                    <FileUp className="mr-2 size-4" /> Upload Report
                </Button>
            </CardContent>
            <CardFooter>
                <p className="text-xs text-muted-foreground">This section is role-restricted.</p>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }
  