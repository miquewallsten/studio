
'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { useSecureFetch } from '@/hooks/use-secure-fetch';
import { useToast } from '@/hooks/use-toast';
import type { Timestamp } from 'firebase/firestore';

type Ticket = {
  id: string;
  subjectName: string;
  reportType: string;
  status: 'New' | 'In Progress' | 'Pending Review' | 'Completed';
  createdAt: string; // ISO string from API
};

type Columns = {
  [key: string]: {
    name: string;
    items: Ticket[];
  };
};

const statusMap: { [key: string]: 'New' | 'In Progress' | 'Pending Review' | 'Completed' } = {
    'new': 'New',
    'in-progress': 'In Progress',
    'pending-review': 'Pending Review',
    'completed': 'Completed'
}

const initialColumns: Columns = {
  'new': { name: 'New', items: [] },
  'in-progress': { name: 'In Progress', items: [] },
  'pending-review': { name: 'Pending Review', items: [] },
  'completed': { name: 'Completed', items: [] },
};

const getStatusFromColumnId = (columnId: string) => {
    return statusMap[columnId];
}

const getColumnIdFromStatus = (status: string) => {
    return Object.keys(statusMap).find(key => statusMap[key] === status) || 'new';
}


export default function WorkflowPage() {
  const [columns, setColumns] = useState<Columns>(initialColumns);
  const [loading, setLoading] = useState(true);
  const secureFetch = useSecureFetch();
  const { toast } = useToast();

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
        const res = await secureFetch('/api/tickets');
        const data = await res.json();
        if(data.error) throw new Error(data.error);

        const newColumns = JSON.parse(JSON.stringify(initialColumns));
        data.tickets.forEach((ticket: Ticket) => {
            const columnId = getColumnIdFromStatus(ticket.status);
            if (newColumns[columnId]) {
                newColumns[columnId].items.push(ticket);
            }
        });
        setColumns(newColumns);

    } catch (error: any) {
        toast({
            title: 'Error',
            description: 'Could not fetch tickets for the workflow.',
            variant: 'destructive',
        });
    } finally {
        setLoading(false);
    }
  }, [secureFetch, toast]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    
    // Optimistic UI update
    const sourceColumn = columns[source.droppableId];
    const destColumn = columns[destination.droppableId];
    const sourceItems = [...sourceColumn.items];
    const destItems = [...destColumn.items];
    const [removed] = sourceItems.splice(source.index, 1);
    
    if (source.droppableId === destination.droppableId) {
        const copiedItems = [...sourceColumn.items];
        copiedItems.splice(source.index, 1);
        copiedItems.splice(destination.index, 0, removed);
        setColumns({
            ...columns,
            [source.droppableId]: { ...sourceColumn, items: copiedItems },
        });
    } else {
        destItems.splice(destination.index, 0, removed);
        setColumns({
            ...columns,
            [source.droppableId]: { ...sourceColumn, items: sourceItems },
            [destination.droppableId]: { ...destColumn, items: destItems },
        });
    }
    
    // Update ticket status in Firestore via API
    const newStatus = getStatusFromColumnId(destination.droppableId);
    try {
        await secureFetch(`/api/tickets/${draggableId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus }),
        });
    } catch (error: any) {
        toast({
            title: 'Update Failed',
            description: 'Could not update ticket status. Reverting change.',
            variant: 'destructive',
        });
        // Revert UI change on failure
        setColumns({
            ...columns,
            [source.droppableId]: { ...sourceColumn, items: [...sourceItems, removed] },
            [destination.droppableId]: { ...destColumn, items: destItems.filter(item => item.id !== removed.id) },
        });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Workflow</h1>
        <Button asChild className="bg-accent hover:bg-accent/90">
            <Link href="/dashboard/tickets/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Ticket
            </Link>
          </Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {loading ? (
             Object.values(initialColumns).map((column, index) => (
                <Card key={index} className="bg-muted/50">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <Skeleton className="h-6 w-32"/>
                            <Skeleton className="h-6 w-6 rounded-full"/>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Skeleton className="h-24 w-full"/>
                        <Skeleton className="h-24 w-full"/>
                    </CardContent>
                </Card>
             ))
          ) : (
            Object.entries(columns).map(([columnId, column]) => (
              <Droppable key={columnId} droppableId={columnId}>
                {(provided, snapshot) => (
                  <Card
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`transition-colors ${snapshot.isDraggingOver ? 'bg-muted' : 'bg-muted/50'}`}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {column.name}
                        <Badge variant="secondary" className="rounded-full">{column.items.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 min-h-[400px]">
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
                                  <Link href={`/dashboard/tickets/${item.id}`}>
                                    <Card
                                      className={`p-4 hover:shadow-md transition-shadow ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                                    >
                                      <h4 className="font-semibold">{item.subjectName}</h4>
                                      <p className="text-sm text-muted-foreground">{item.reportType}</p>
                                      <p className="text-xs text-muted-foreground mt-2">
                                        Created: {item.createdAt ? format(new Date(item.createdAt), 'PPP') : ''}
                                      </p>
                                    </Card>
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Click to view ticket details</p>
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
    </div>
  );
}
