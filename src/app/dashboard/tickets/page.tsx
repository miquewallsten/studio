
'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
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

export default function TicketsPage() {
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ticketsData: Ticket[] = [];
      querySnapshot.forEach((doc) => {
        ticketsData.push({ id: doc.id, ...doc.data() } as Ticket);
      });
      setAllTickets(ticketsData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching tickets: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
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
           ) : (
            <DataTable 
                columns={memoizedColumns} 
                data={allTickets}
            />
           )}
        </CardContent>
      </Card>
    </div>
  );
}
