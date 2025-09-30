
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
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { format } from 'date-fns';
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
    email?: string;
}

type Columns = {
  [key: string]: {
    name: string;
    items: Ticket[];
  };
};

const getStatusFromColumnId = (columnId: string, analysts: Analyst[]): Ticket['status'] => {
    if (columnId === 'new') return 'New';
    if (columnId === 'pending-review') return 'Pending Review';
    if (columnId === 'completed') return 'Completed';
    if (analysts.some(a => a.uid === columnId)) return 'In Progress';
    return 'New'; // Fallback
}

const getColumnIdFromTicket = (ticket: Ticket): string => {
    if (ticket.status === 'New') return 'new';
    if (ticket.status === 'Pending Review') return 'pending-review';
    if (ticket.status === 'Completed') return 'completed';
    if (ticket.status === 'In Progress' && ticket.assignedAnalystId) return ticket.assignedAnalystId;
    return 'new'; // Fallback for tickets that might be in progress but unassigned
}


export function WorkflowWidget({ analysts }: { analysts: Analyst[] }) {
  const [columns, setColumns] = useState<Columns>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialColumns: Columns = {
      'new': { name: 'New Tickets', items: [] },
      ...analysts.reduce((acc, analyst) => {
        acc[analyst.uid] = { name: analyst.email || 'Unnamed Analyst', items: [] };
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

      const newColumns: Columns = JSON.parse(JSON.stringify(initialColumns));
      ticketsData.forEach((ticket) => {
        const columnId = getColumnIdFromTicket(ticket);
        if (newColumns[columnId]) {
          newColumns[columnId].items.push(ticket);
        } else {
            // If a ticket is assigned to an analyst that doesn't exist anymore, put it in 'New'
            newColumns['new'].items.push(ticket);
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
    
    // Optimistic UI Update
    const sourceColumn = columns[source.droppableId];
    const destColumn = columns[destination.droppableId];
    const sourceItems = [...sourceColumn.items];
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
      const destItems = [...destColumn.items];
      destItems.splice(destination.index, 0, removed);
      setColumns({
        ...columns,
        [source.droppableId]: { ...sourceColumn, items: sourceItems },
        [destination.droppableId]: { ...destColumn, items: destItems },
      });
    }
    
    // Firestore Update
    const newStatus = getStatusFromColumnId(destination.droppableId, analysts);
    const assignedAnalystId = analysts.find(a => a.uid === destination.droppableId)?.uid || null;

    const ticketRef = doc(db, 'tickets', draggableId);
    updateDoc(ticketRef, { 
        status: newStatus, 
        assignedAnalystId: destination.droppableId === 'new' ? null : assignedAnalystId || removed.assignedAnalystId,
    });
  };

  const columnOrder = ['new', ...analysts.map(a => a.uid), 'pending-review', 'completed'];


  return (
    <Card className="h-full flex flex-col non-draggable">
        <CardHeader>
            <CardTitle>Manager's Workflow</CardTitle>
            <CardDescription>Drag tickets from 'New' to an analyst's column to assign them. Drag between other columns to update status.</CardDescription>
        </CardHeader>
      <CardContent className="flex-1 overflow-x-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 h-full">
            {loading ? (
              Array.from({length: 4}).map((_, index) => (
                <Card key={index} className="bg-muted/50 w-72 flex-shrink-0">
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
              columnOrder.map((columnId) => {
                const column = columns[columnId];
                if (!column) return null;
                return (
                <Droppable key={columnId} droppableId={columnId}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`w-72 flex-shrink-0 h-full flex flex-col rounded-lg transition-colors ${
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
              )})
            )}
          </div>
        </DragDropContext>
      </CardContent>
    </Card>
  );
}
