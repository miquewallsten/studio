

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Field } from '@/app/dashboard/fields/schema';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Draggable, Droppable } from '@hello-pangea/dnd';

export function FieldLibrary() {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, 'fields'), orderBy('label'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fieldsData: Field[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fieldsData.push({
          id: doc.id,
          label: data.label,
          type: data.type,
          subFields: data.subFields || [],
          aiInstructions: data.aiInstructions || '',
          internalFields: data.internalFields || [],
        });
      });
      setFields(fieldsData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching fields:", error);
        toast({
            title: "Error",
            description: "Could not fetch field library.",
            variant: "destructive"
        });
        setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);
  
  const filteredFields = useMemo(() => {
    if (!searchQuery) return fields;
    return fields.filter(field => field.label.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [fields, searchQuery]);

  return (
    <Droppable droppableId="field-library-drag-source" isDropDisabled={true}>
        {(provided) => (
            <Card 
                className="h-full flex flex-col"
                ref={provided.innerRef}
                {...provided.droppableProps}
            >
                <CardHeader>
                    <CardTitle>Field Library</CardTitle>
                    <CardDescription>
                        Drag fields onto your form.
                    </CardDescription>
                    <div className="relative pt-2">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search library..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-6 pt-0">
                      {loading ? (
                          <p className="text-muted-foreground text-sm p-4">Loading library...</p>
                      ) : (
                        <div className="space-y-2">
                          {filteredFields.map((field, index) => (
                            <Draggable key={field.id} draggableId={field.id} index={index}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className="w-full text-left p-3 rounded-lg border bg-card flex justify-between items-center transition-shadow hover:shadow-md"
                                        style={{...provided.draggableProps.style, ...(snapshot.isDragging && { boxShadow: '0 4px 6px rgba(0,0,0,0.1)' })}}
                                    >
                                        <span className="font-medium">{field.label}</span>
                                        <Badge variant="outline">{field.type}</Badge>
                                    </div>
                                )}
                            </Draggable>
                          ))}
                           {provided.placeholder}
                        </div>
                      )}
                      {!loading && filteredFields.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-10">No fields found.</p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
            </Card>
        )}
    </Droppable>
  );
}
