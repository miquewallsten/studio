
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '../ui/button';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

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
};

type Columns = {
  [key: string]: {
    name: string;
    items: Ticket[];
  };
};

const STATIC_COLUMNS = {
    'new': { name: 'New', items: [] },
    'pending-review': { name: 'Pending Review', items: [] },
    'completed': { name: 'Completed', items: [] },
};

interface WorkflowWidgetProps {
    title: string;
    description: string;
}

export function WorkflowWidget({ title, description }: WorkflowWidgetProps) {
  const [columns, setColumns] = useState<Columns>(STATIC_COLUMNS);
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalystsAndTickets = async () => {
        setLoading(true);
        try {
            const usersResponse = await fetch('/api/users');
            const usersData = await usersResponse.json();
            if (!usersResponse.ok) throw new Error('Failed to fetch users');
            
            const fetchedAnalysts: Analyst[] = usersData.users.filter((u: any) => u.role === 'Analyst');
            setAnalysts(fetchedAnalysts);

            const dynamicAnalystColumns = fetchedAnalysts.reduce((acc, analyst) => {
                acc[analyst.uid] = { name: analyst.email, items: [] };
                return acc;
            }, {} as Columns);

            const initialColumns = { ...STATIC_COLUMNS, ...dynamicAnalystColumns };
            Object.keys(initialColumns).forEach(key => {
                initialColumns[key].items = [];
            });


            const ticketsQuery = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
            const unsubscribe = onSnapshot(ticketsQuery, (querySnapshot) => {
                const newColumns = JSON.parse(JSON.stringify(initialColumns));
                
                querySnapshot.forEach((doc) => {
                    const ticket = { id: doc.id, ...doc.data() } as Ticket;
                    let columnId: string;

                    if (ticket.status === 'In Progress' && ticket.assignedAnalystId) {
                        columnId = ticket.assignedAnalystId;
                    } else {
                        columnId = Object.keys(STATIC_COLUMNS).find(key => STATIC_COLUMNS[key as keyof typeof STATIC_COLUMNS].name === ticket.status) || 'new';
                    }

                    if (newColumns[columnId]) {
                        newColumns[columnId].items.push(ticket);
                    }
                });
                setColumns(newColumns);
            });

            setLoading(false);
            return unsubscribe;

        } catch (error) {
            console.error("Error initializing workflow widget: ", error);
            setLoading(false);
        }
    }

    const unsubscribePromise = fetchAnalystsAndTickets();

    return () => {
        unsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe());
    };

  }, []);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId) return; // No change

    const sourceColumn = columns[source.droppableId];
    const destColumn = columns[destination.droppableId];
    const sourceItems = [...sourceColumn.items];
    const destItems = [...destColumn.items];
    const [removed] = sourceItems.splice(source.index, 1);
    
    // Update UI optimistically
    destItems.splice(destination.index, 0, removed);
    setColumns({
        ...columns,
        [source.droppableId]: { ...sourceColumn, items: sourceItems },
        [destination.droppableId]: { ...destColumn, items: destItems },
    });

    // Determine new status and analyst assignment
    const ticketRef = doc(db, 'tickets', draggableId);
    const destColumnId = destination.droppableId;
    let newStatus: Ticket['status'] = 'New';
    let assignedAnalystId: string | null = null;
    
    if (analysts.some(a => a.uid === destColumnId)) {
        newStatus = 'In Progress';
        assignedAnalystId = destColumnId;
    } else if (destColumnId === 'pending-review') {
        newStatus = 'Pending Review';
    } else if (destColumnId === 'completed') {
        newStatus = 'Completed';
    }

    updateDoc(ticketRef, {
        status: newStatus,
        assignedAnalystId: assignedAnalystId || null
    }).catch(err => {
        // Revert UI on failure
        console.error("Failed to update ticket: ", err);
        setColumns(columns);
    });
  };

  const orderedColumnIds = ['new', ...analysts.map(a => a.uid), 'pending-review', 'completed'];

  return (
    <>
      <Card className="h-full flex flex-col non-draggable">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription className="text-xs">
                {description}
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/tickets" target="_blank">
                  <ExternalLink className="mr-2" /> View Full
                </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto p-2">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-4 gap-2 h-full">
              {loading
                ? orderedColumnIds.map((id) => (
                    <div key={id} className="bg-muted/50 rounded-lg p-2">
                      <Skeleton className="h-5 w-20 mb-2" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ))
                : orderedColumnIds.map((columnId) => {
                    const column = columns[columnId];
                    if (!column) return null;
                    return (
                        <Droppable key={columnId} droppableId={columnId}>
                        {(provided, snapshot) => (
                            <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`p-1 rounded-lg transition-colors h-full overflow-y-auto ${
                                snapshot.isDraggingOver ? 'bg-muted' : 'bg-muted/40'
                            }`}
                            >
                            <h3 className="text-sm font-semibold p-1 flex justify-between items-center truncate">
                                <span className="truncate">{column.name}</span>
                                <Badge variant="secondary" className="rounded-full">{column.items.length}</Badge>
                            </h3>
                            <div className="space-y-1 min-h-[50px]">
                            {column.items.map((item, index) => (
                                <Draggable
                                key={item.id}
                                draggableId={item.id}
                                index={index}
                                >
                                {(provided) => (
                                    <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    >
                                    <Card className="p-2 text-xs relative group/ticket">
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
                    )
                })}
            </div>
          </DragDropContext>
        </CardContent>
      </Card>
    </>
  );
}
