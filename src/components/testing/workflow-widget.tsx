
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

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
  return (
    Object.keys(statusMap).find((key) => statusMap[key] === status) || 'new'
  );
};

interface WorkflowWidgetProps {
    title: string;
    description: string;
}

export function WorkflowWidget({ title, description }: WorkflowWidgetProps) {
  const [columns, setColumns] = useState<Columns>(initialColumns);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const newColumns = JSON.parse(JSON.stringify(initialColumns));
      querySnapshot.forEach((doc) => {
        const ticket = { id: doc.id, ...doc.data() } as Ticket;
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
      return; // For this widget, no reordering action is needed
    } else {
      // Moving to a different column
      const sourceColumn = columns[source.droppableId];
      const destColumn = columns[destination.droppableId];
      const sourceItems = [...sourceColumn.items];
      const destItems = [...destColumn.items];
      const [removed] = sourceItems.splice(source.index, 1);
      destItems.splice(destination.index, 0, removed);

      // Optimistically update UI
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

  return (
    <Card className="h-full flex flex-col non-draggable">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-2">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-4 gap-2 h-full">
            {loading
              ? Object.values(initialColumns).map((column, index) => (
                  <div key={index} className="bg-muted/50 rounded-lg p-2">
                     <Skeleton className="h-5 w-20 mb-2" />
                     <Skeleton className="h-16 w-full" />
                  </div>
                ))
              : Object.entries(columns).map(([columnId, column]) => (
                  <Droppable key={columnId} droppableId={columnId}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`p-1 rounded-lg transition-colors h-full overflow-y-auto ${
                          snapshot.isDraggingOver ? 'bg-muted' : 'bg-muted/40'
                        }`}
                      >
                        <h3 className="text-sm font-semibold p-1 flex justify-between items-center">
                            {column.name}
                            <Badge variant="secondary" className="rounded-full">{column.items.length}</Badge>
                        </h3>
                        <div className="space-y-1 min-h-[50px]">
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
                                <Card className="p-2 text-xs">
                                  <p className="font-semibold truncate">{item.subjectName}</p>
                                  <p className="text-muted-foreground">{item.reportType}</p>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        </div>
                      </div>
                    )}
                  </Droppable>
                ))}
          </div>
        </DragDropContext>
      </CardContent>
    </Card>
  );
}
