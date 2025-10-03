
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PlusCircle, Search } from 'lucide-react';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Field } from './schema';
import { FieldEditor } from '@/components/field-editor';
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { NewFieldDialog } from '@/components/new-field-dialog';
import { useSecureFetch } from '@/hooks/use-secure-fetch';


export default function FieldsPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [fieldToDelete, setFieldToDelete] = useState<Field | null>(null);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewFieldDialogOpen, setNewFieldDialogOpen] = useState(false);
  const { toast } = useToast();
  const secureFetch = useSecureFetch();

  const fetchFields = useCallback(async () => {
    setLoading(true);
    try {
        const res = await secureFetch('/api/fields');
        const data = await res.json();
        if(data.error) throw new Error(data.error);
        setFields(data.fields);
    } catch(error: any) {
        console.error("Error fetching fields:", error);
        toast({
            title: "Error",
            description: "Could not fetch fields.",
            variant: "destructive"
        })
    } finally {
        setLoading(false);
    }
  }, [secureFetch, toast]);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);
  
  const filteredFields = useMemo(() => {
    if (!searchQuery) return fields;
    return fields.filter(field => field.label.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [fields, searchQuery]);

  const handleDelete = async () => {
    if (fieldToDelete) {
      try {
        await secureFetch(`/api/fields/${fieldToDelete.id}`, { method: 'DELETE' });
        toast({
          title: 'Field Deleted',
          description: `The field "${fieldToDelete.label}" has been deleted.`,
        });
        if (selectedField?.id === fieldToDelete.id) {
          setSelectedField(null);
        }
        fetchFields(); // Re-fetch after deletion
      } catch (error: any) {
        toast({
          title: 'Error',
          description: 'Failed to delete the field. It might be in use.',
          variant: 'destructive',
        });
        console.error('Error deleting field:', error);
      } finally {
        setFieldToDelete(null);
      }
    }
  };
  
  const handleSelectField = (field: Field) => {
    setSelectedField(field);
  };
  
  const handleFieldUpdate = () => {
    fetchFields();
    if (selectedField) {
      // Find the updated field in the new list and re-select it
      const updatedField = fields.find(f => f.id === selectedField.id);
      setSelectedField(updatedField || null);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh_-_8rem)]">
       <AlertDialog open={fieldToDelete !== null} onOpenChange={(open) => !open && setFieldToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              field <span className="font-bold">"{fieldToDelete?.label}"</span>. If this field is used in any forms, it may cause unexpected behavior.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Yes, delete field
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <NewFieldDialog
        isOpen={isNewFieldDialogOpen}
        onOpenChange={setNewFieldDialogOpen}
        onFieldCreated={fetchFields}
      />


      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Field Library</h1>
        <Button onClick={() => setNewFieldDialogOpen(true)} className="bg-accent hover:bg-accent/90">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Field
        </Button>
      </div>

       <PanelGroup direction="horizontal" className="flex-1">
        <Panel defaultSize={40} minSize={30}>
            <Card className="h-full flex flex-col">
                <CardHeader>
                    <CardTitle>Reusable Fields</CardTitle>
                    <CardDescription>
                        Manage reusable fields. Click a field to edit.
                    </CardDescription>
                    <div className="relative pt-2">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by label..."
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
                          <p className="text-muted-foreground text-sm p-4">Loading fields...</p>
                      ) : (
                        <div className="space-y-2">
                          {filteredFields.map(field => (
                            <button
                              key={field.id}
                              onClick={() => handleSelectField(field)}
                              className={cn(
                                "w-full text-left p-3 rounded-lg border flex justify-between items-center transition-colors",
                                selectedField?.id === field.id 
                                  ? "bg-muted border-primary" 
                                  : "hover:bg-muted/50"
                              )}
                            >
                              <span className="font-medium">{field.label}</span>
                              <Badge variant="outline">{field.type}</Badge>
                            </button>
                          ))}
                        </div>
                      )}
                      {!loading && filteredFields.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-10">No fields found.</p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
            </Card>
        </Panel>
        <PanelResizeHandle className="w-2 bg-transparent hover:bg-muted transition-colors data-[resize-handle-state=drag]:bg-muted-foreground" />
        <Panel defaultSize={60} minSize={40}>
           <div className="h-full overflow-y-auto pl-4">
            {selectedField ? (
                    <FieldEditor 
                        key={selectedField.id}
                        field={selectedField}
                        onFieldUpdated={handleFieldUpdate}
                        onDeleteField={() => setFieldToDelete(selectedField)}
                    />
            ) : (
                    <Card className="h-full flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                            <p>Select a field to view and edit its details.</p>
                        </div>
                    </Card>
            )}
           </div>
        </Panel>
       </PanelGroup>

    </div>
  );
}
