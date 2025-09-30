
'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import { AssignTicketDialog } from './assign-ticket-dialog';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

type Ticket = {
  id: string;
  subjectName: string;
  reportType: string;
  status: 'New' | 'In Progress' | 'Pending Review' | 'Completed';
  createdAt: Timestamp;
  assignedAnalystId?: string;
};

type Analyst = {
    uid: string;
    email: string;
}

type Columns = {
  [key: string]: {
    name: string;
    items: Ticket[];
  };
};

const getStatusFromColumnId = (columnId: string): Ticket['status'] => {
    if (columnId === 'new') return 'New';
    if (columnId === 'pending-review') return 'Pending Review';
    if (columnId === 'completed') return 'Completed';
    return 'In Progress';
}

const getColumnIdFromTicket = (ticket: Ticket): string => {
    if (ticket.status === 'New') return 'new';
    if (ticket.status === 'Pending Review') return 'pending-review';
    if (ticket.status === 'Completed') return 'completed';
    if (ticket.assignedAnalystId) return ticket.assignedAnalystId;
    return 'new'; // Fallback for in-progress but unassigned
}


export function WorkflowWidget({ title, description, analysts }: { title: string, description: string, analysts: Analyst[] }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [columns, setColumns] = useState<Columns>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialColumns: Columns = {
      'new': { name: 'New', items: [] },
      ...analysts.reduce((acc, analyst) => {
        acc[analyst.uid] = { name: analyst.email, items: [] };
        return acc;
      }, {} as Columns),
      'pending-review': { name: 'Pending Review', items: [] },
      'completed': { name: 'Completed', items: [] },
    };

    const q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ticketsData: Ticket[] = [];
      querySnapshot.forEach((doc) => {
        ticketsData.push({ id: doc.id, ...doc.data() } as Ticket);
      });
      setTickets(ticketsData);

      const newColumns: Columns = JSON.parse(JSON.stringify(initialColumns));
      ticketsData.forEach((ticket) => {
        const columnId = getColumnIdFromTicket(ticket);
        if (newColumns[columnId]) {
          newColumns[columnId].items.push(ticket);
        } else if (ticket.status === 'In Progress') { // Handle case where analyst might be missing
            if (!newColumns['unassigned-progress']) {
                newColumns['unassigned-progress'] = { name: 'In Progress (Unassigned)', items: []};
            }
            newColumns['unassigned-progress'].items.push(ticket);
        }
      });
      setColumns(newColumns);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [analysts]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    
    const sourceColumn = columns[source.droppableId];
    const destColumn = columns[destination.droppableId];
    const sourceItems = [...sourceColumn.items];
    const [removed] = sourceItems.splice(source.index, 1);
    
    let newStatus = getStatusFromColumnId(destination.droppableId);
    let assignedAnalystId: string | null = (analysts.find(a => a.uid === destination.droppableId)?.uid) || null
    
    if (source.droppableId !== destination.droppableId) {
      if (analysts.some(a => a.uid === destination.droppableId)) {
          newStatus = 'In Progress';
          assignedAnalystId = destination.droppableId;
      } else {
          assignedAnalystId = removed.assignedAnalystId || null;
      }
      if (destination.droppableId === 'new') {
          assignedAnalystId = null;
      }
    }


    if (source.droppableId === destination.droppableId) {
      // Reordering within the same column
      const copiedItems = [...sourceColumn.items];
      copiedItems.splice(source.index, 1);
      copiedItems.splice(destination.index, 0, removed);
      setColumns({
        ...columns,
        [source.droppableId]: { ...sourceColumn, items: copiedItems },
      });
    } else {
      // Moving to a different column
      const destItems = [...destColumn.items];
      destItems.splice(destination.index, 0, removed);

      setColumns({
        ...columns,
        [source.droppableId]: { ...sourceColumn, items: sourceItems },
        [destination.droppableId]: { ...destColumn, items: destItems },
      });

      const ticketRef = doc(db, 'tickets', draggableId);
      updateDoc(ticketRef, { status: newStatus, assignedAnalystId: assignedAnalystId });
    }
  };

  return (
    <Card className="h-full flex flex-col non-draggable">
        <CardHeader>
            <CardTitle>{title}</CardTitle>
            <p className="text-sm text-muted-foreground">{description}</p>
        </CardHeader>
      <CardContent className="flex-1 overflow-x-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 h-full">
            {loading ? (
              Array.from({length: 4}).map((_, index) => (
                <Card key={index} className="bg-muted/50 w-64 flex-shrink-0">
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : (
              Object.entries(columns).map(([columnId, column]) => (
                <Droppable key={columnId} droppableId={columnId}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`w-64 flex-shrink-0 h-full flex flex-col rounded-lg transition-colors ${
                        snapshot.isDraggingOver ? 'bg-muted' : 'bg-muted/50'
                      }`}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between text-base">
                          <span className="truncate">{column.name}</span>
                          <Badge variant="secondary" className="rounded-full">
                            {column.items.length}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <ScrollArea className="flex-1">
                        <CardContent className="space-y-2 pb-4">
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
                                                <Card
                                                    className={`p-3 transition-shadow hover:shadow-md ${
                                                    snapshot.isDragging ? 'shadow-lg' : ''
                                                    }`}
                                                >
                                                    <h4 className="font-semibold text-sm">
                                                    {item.subjectName}
                                                    </h4>
                                                    <p className="text-xs text-muted-foreground">
                                                    {item.reportType}
                                                    </p>
                                                    <p className="mt-2 text-xs text-muted-foreground">
                                                    {format(item.createdAt.toDate(), 'PP')}
                                                    </p>
                                                </Card>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Drag to change status or assign</p>
                                        </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    </div>
                                )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </CardContent>
                      </ScrollArea>
                    </div>
                  )}
                </Droppable>
              ))
            )}
          </div>
        </DragDropContext>
      </CardContent>
    </Card>
  );
}
    