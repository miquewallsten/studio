
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
import { DataTable } from '@/components/ui/data-table';
import { useLanguage } from '@/contexts/language-context';
import { columns } from './columns';
import type { Ticket } from './schema';

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
  const [columnsData, setColumnsData] = useState<Columns>(initialColumns);
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

      // Also update columns for Kanban view
      const newColumns = JSON.parse(JSON.stringify(initialColumns));
      ticketsData.forEach((ticket) => {
        const columnId = getColumnIdFromStatus(ticket.status);
        if (newColumns[columnId]) {
          newColumns[columnId].items.push(ticket);
        }
      });
      setColumnsData(newColumns);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const memoizedColumns = useMemo(() => columns, []);


  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId) {
      // Reordering within the same column
      const column = columnsData[source.droppableId];
      const copiedItems = [...column.items];
      const [removed] = copiedItems.splice(source.index, 1);
      copiedItems.splice(destination.index, 0, removed);
      setColumnsData({
        ...columnsData,
        [source.droppableId]: {
          ...column,
          items: copiedItems,
        },
      });
    } else {
      // Moving to a different column
      const sourceColumn = columnsData[source.droppableId];
      const destColumn = columnsData[destination.droppableId];
      const sourceItems = [...sourceColumn.items];
      const destItems = [...destColumn.items];
      const [removed] = sourceItems.splice(source.index, 1);
      destItems.splice(destination.index, 0, removed);

      setColumnsData({
        ...columnsData,
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
  
  const translatedColumns = useMemo(() => ({
      new: { name: t('tickets.status_new'), items: columnsData.new.items },
      'in-progress': { name: t('tickets.status_in_progress'), items: columnsData['in-progress'].items },
      'pending-review': { name: t('tickets.status_pending_review'), items: columnsData['pending-review'].items },
      completed: { name: t('tickets.status_completed'), items: columnsData.completed.items },
  }), [t, columnsData]);

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh_-_100px)]">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">{t('nav.tickets')}</h1>
        <Button asChild className="bg-accent hover:bg-accent/90">
          <Link href="/dashboard/tickets/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('tickets.new_ticket_button')}
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="list" className="w-full flex-1 flex flex-col">
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
        

        <TabsContent value="list" className="flex-1 overflow-hidden">
          <Card className="h-full flex flex-col">
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
                    <DataTable columns={memoizedColumns} data={allTickets} />
                )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="kanban" className="flex-1 overflow-hidden">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 h-full">
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
                        className={`transition-colors flex flex-col ${
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
                        <CardContent className="flex-1 overflow-y-auto space-y-2">
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
