
'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DataTable } from '@/components/ui/data-table';
import { useLanguage } from '@/contexts/language-context';
import { columns } from './columns';
import type { Ticket } from './schema';
import { useSecureFetch } from '@/hooks/use-secure-fetch';

export default function TicketsPage() {
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const { t } = useLanguage();
  const secureFetch = useSecureFetch();

  useEffect(() => {
    const fetchTickets = async () => {
        try {
            setLoading(true);
            const res = await secureFetch('/api/tickets');
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setAllTickets(data.tickets);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }
    fetchTickets();
  }, [secureFetch]);
  
  const memoizedColumns = useMemo(() => columns, []);

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">{t('nav.tickets')}</h1>
        <Button asChild className="bg-accent hover:bg-accent/90">
          <Link href="/dashboard/tickets/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('tickets.new_ticket_button')}
          </Link>
        </Button>
      </div>
      <Card className="h-[calc(100vh_-_10rem)] flex flex-col">
        <CardHeader>
          <CardTitle>{t('tickets.table_title')}</CardTitle>
          <CardDescription>
            {t('tickets.table_desc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
           {loading ? (
             <p>{t('common.loading')}...</p>
           ) : error ? (
            <p className='text-destructive'>{error}</p>
           ) : (
            <DataTable 
                columns={memoizedColumns} 
                data={allTickets}
                tableId="tickets-table"
            />
           )}
        </CardContent>
      </Card>
    </div>
  );
}
