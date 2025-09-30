import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ClipboardList, UserCheck, Users } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowUpRight } from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    {
      title: 'New Tickets',
      value: '0',
      icon: <ClipboardList className="h-4 w-4 text-muted-foreground" />,
      change: '+0.0%',
    },
    {
      title: 'In Progress',
      value: '0',
      icon: <UserCheck className="h-4 w-4 text-muted-foreground" />,
      change: '+0.0%',
    },
    {
      title: 'Total Clients',
      value: '0',
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
      change: '+0.0%',
    },
  ];

  return (
    <div className="flex-1 space-y-4">
      <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Recent Tickets</CardTitle>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1 bg-accent hover:bg-accent/90">
              <Link href="/dashboard/tickets">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Status
                </TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No recent tickets.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
