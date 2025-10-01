
'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  List,
  KanbanSquare,
  PlusCircle,
  Search,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLanguage } from '@/contexts/language-context';

type Ticket = {
  id: string;
  subjectName: string;
  reportType: string;
  status: 'New' | 'In Progress' | 'Pending Review' | 'Completed';
  createdAt: Timestamp;
};

type Columns = {
  [key: string]: {
    name: string;
    items: Ticket[];
  };
};

const statusMap: {
  [key: string]: 'New' | 'In Progress' | 'Pending Review' | 'Completed';
} = {
  new: 'New',
  'in-progress': 'In Progress',
  'pending-review': 'Pending Review',
  completed: 'Completed',
};

const initialColumns: Columns = {
  new: {
    name: 'New',
    items: [],
  },
  'in-progress': {
    name: 'In Progress',
    items: [],
  },
  'pending-review': {
    name: 'Pending Review',
    items: [],
  },
  completed: {
    name: 'Completed',
    items: [],
  },
};

const getStatusFromColumnId = (columnId: string) => {
  return statusMap[columnId];
};

const getColumnIdFromStatus = (status: string) => {
  return Object.keys(statusMap).find((key) => statusMap[key] === status) || 'new';
};

export default function TicketsPage() {
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [columns, setColumns] = useState<Columns>(initialColumns);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    const q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ticketsData: Ticket[] = [];
      querySnapshot.forEach((doc) => {
        ticketsData.push({ id: doc.id, ...doc.data() } as Ticket);
      });
      setAllTickets(ticketsData);

      // Also update columns for Kanban view
      const newColumns = JSON.parse(JSON.stringify(initialColumns));
      ticketsData.forEach((ticket) => {
        const columnId = getColumnIdFromStatus(ticket.status);
        if (newColumns[columnId]) {
          newColumns[columnId].items.push(ticket);
        }
      });
      setColumns(newColumns);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId) {
      // Reordering within the same column
      const column = columns[source.droppableId];
      const copiedItems = [...column.items];
      const [removed] = copiedItems.splice(source.index, 1);
      copiedItems.splice(destination.index, 0, removed);
      setColumns({
        ...columns,
        [source.droppableId]: {
          ...column,
          items: copiedItems,
        },
      });
    } else {
      // Moving to a different column
      const sourceColumn = columns[source.droppableId];
      const destColumn = columns[destination.droppableId];
      const sourceItems = [...sourceColumn.items];
      const destItems = [...destColumn.items];
      const [removed] = sourceItems.splice(source.index, 1);
      destItems.splice(destination.index, 0, removed);

      setColumns({
        ...columns,
        [source.droppableId]: {
          ...sourceColumn,
          items: sourceItems,
        },
        [destination.droppableId]: {
          ...destColumn,
          items: destItems,
        },
      });

      // Update ticket status in Firestore
      const newStatus = getStatusFromColumnId(destination.droppableId);
      const ticketRef = doc(db, 'tickets', draggableId);
      updateDoc(ticketRef, { status: newStatus });
    }
  };

  const filteredTickets = useMemo(() => {
    return allTickets.filter(
      (ticket) =>
        ticket.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.reportType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allTickets, searchQuery]);
  
  const translatedColumns = useMemo(() => ({
      new: { name: t('tickets.status_new'), items: columns.new.items },
      'in-progress': { name: t('tickets.status_in_progress'), items: columns['in-progress'].items },
      'pending-review': { name: t('tickets.status_pending_review'), items: columns['pending-review'].items },
      completed: { name: t('tickets.status_completed'), items: columns.completed.items },
  }), [t, columns]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">{t('nav.tickets')}</h1>
        <Button asChild className="bg-accent hover:bg-accent/90">
          <Link href="/dashboard/tickets/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('tickets.new_ticket_button')}
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="list">
              <List className="mr-2 h-4 w-4" />
              {t('tickets.list_view')}
            </TabsTrigger>
            <TabsTrigger value="kanban">
              <KanbanSquare className="mr-2 h-4 w-4" />
              {t('tickets.kanban_view')}
            </TabsTrigger>
          </TabsList>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('tickets.search_placeholder')}
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>{t('tickets.table_title')}</CardTitle>
              <CardDescription>
                {t('tickets.table_desc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.subject')}</TableHead>
                    <TableHead>{t('tickets.columns.report_type')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead>{t('common.created')}</TableHead>
                    <TableHead>
                      <span className="sr-only">{t('common.action')}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        {t('common.loading')}...
                      </TableCell>
                    </TableRow>
                  ) : filteredTickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        {t('common.no_results')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium">
                          {ticket.subjectName}
                        </TableCell>
                        <TableCell>{ticket.reportType}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              ticket.status === 'New'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {ticket.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {ticket.createdAt
                            ? format(ticket.createdAt.toDate(), 'PPP')
                            : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="ghost" size="icon">
                            <Link href={`/dashboard/tickets/${ticket.id}`}>
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="kanban">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {loading ? (
                Object.values(initialColumns).map((column, index) => (
                  <Card key={index} className="bg-muted/50">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-6 w-6 rounded-full" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </CardContent>
                  </Card>
                ))
              ) : (
                Object.entries(translatedColumns).map(([columnId, column]) => (
                  <Droppable key={columnId} droppableId={columnId}>
                    {(provided, snapshot) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`transition-colors ${
                          snapshot.isDraggingOver ? 'bg-muted' : 'bg-muted/50'
                        }`}
                      >
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            {column.name}
                            <Badge variant="secondary" className="rounded-full">
                              {column.items.length}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="min-h-[400px] space-y-2">
                          {column.items.map((item, index) => (
                            <Draggable
                              key={item.id}
                              draggableId={item.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Link
                                          href={`/dashboard/tickets/${item.id}`}
                                        >
                                          <Card
                                            className={`p-4 transition-shadow hover:shadow-md ${
                                              snapshot.isDragging
                                                ? 'shadow-lg'
                                                : ''
                                            }`}
                                          >
                                            <h4 className="font-semibold">
                                              {item.subjectName}
                                            </h4>
                                            <p className="text-sm text-muted-foreground">
                                              {item.reportType}
                                            </p>
                                            <p className="mt-2 text-xs text-muted-foreground">
                                              {t('common.created')}:{' '}
                                              {item.createdAt
                                                ? format(
                                                    item.createdAt.toDate(),
                                                    'PPP'
                                                  )
                                                : ''}
                                            </p>
                                          </Card>
                                        </Link>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{t('tickets.tooltip_view_details')}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </CardContent>
                      </Card>
                    )}
                  </Droppable>
                ))
              )}
            </div>
          </DragDropContext>
        </TabsContent>
      </Tabs>
    </div>
  );
}
