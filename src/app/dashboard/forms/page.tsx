
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
import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { NewFormDialog } from '@/components/new-form-dialog';
import { FormEditor } from '@/components/form-editor';

export type Form = {
  id: string;
  name: string;
  description: string;
  createdAt: Timestamp;
};

export default function FormsPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [formToDelete, setFormToDelete] = useState<Form | null>(null);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewFormDialogOpen, setNewFormDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchForms = () => {
    setLoading(true);
    const q = query(collection(db, 'forms'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const formsData: Form[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        formsData.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          createdAt: data.createdAt,
        });
      });
      setForms(formsData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching forms:", error);
        toast({
            title: "Error",
            description: "Could not fetch forms.",
            variant: "destructive"
        })
        setLoading(false);
    });

    return unsubscribe;
  }

  useEffect(() => {
    const unsubscribe = fetchForms();
    return () => unsubscribe();
  }, []);
  
  const filteredForms = useMemo(() => {
    if (!searchQuery) return forms;
    return forms.filter(form => form.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [forms, searchQuery]);

  const handleDelete = async () => {
    if (formToDelete) {
      try {
        await deleteDoc(doc(db, 'forms', formToDelete.id));
        toast({
          title: 'Form Deleted',
          description: `The form "${formToDelete.name}" has been deleted.`,
        });
        if (selectedForm?.id === formToDelete.id) {
          setSelectedForm(null);
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete the form.',
          variant: 'destructive',
        });
        console.error('Error deleting form:', error);
      } finally {
        setFormToDelete(null);
      }
    }
  };
  
  const handleSelectForm = (form: Form) => {
    setSelectedForm(form);
  };
  
  const handleFormUpdate = () => {
    // onSnapshot should handle the update, but we can force a re-render if needed
  };

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh_-_8rem)]">
       <AlertDialog open={formToDelete !== null} onOpenChange={(open) => !open && setFormToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              form template <span className="font-bold">"{formToDelete?.name}"</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Yes, delete form
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <NewFormDialog
        isOpen={isNewFormDialogOpen}
        onOpenChange={setNewFormDialogOpen}
        onFormCreated={() => { /* onSnapshot will auto-update the list */ }}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Form Templates</h1>
        <Button onClick={() => setNewFormDialogOpen(true)} className="bg-accent hover:bg-accent/90">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Form Template
        </Button>
      </div>

       <PanelGroup direction="horizontal" className="flex-1">
        <Panel defaultSize={40} minSize={30}>
            <Card className="h-full flex flex-col">
                <CardHeader>
                    <CardTitle>All Form Templates</CardTitle>
                    <CardDescription>
                        Manage reusable form templates. Click a form to edit.
                    </CardDescription>
                    <div className="relative pt-2">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by name..."
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
                          <p className="text-muted-foreground text-sm p-4">Loading forms...</p>
                      ) : (
                        <div className="space-y-2">
                          {filteredForms.map(form => (
                            <button
                              key={form.id}
                              onClick={() => handleSelectForm(form)}
                              className={cn(
                                "w-full text-left p-3 rounded-lg border flex justify-between items-start transition-colors",
                                selectedForm?.id === form.id 
                                  ? "bg-muted border-primary" 
                                  : "hover:bg-muted/50"
                              )}
                            >
                                <div>
                                    <p className="font-medium">{form.name}</p>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{form.description}</p>
                                </div>
                            </button>
                          ))}
                        </div>
                      )}
                      {!loading && filteredForms.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-10">No forms found.</p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
            </Card>
        </Panel>
        <PanelResizeHandle className="w-2 bg-transparent hover:bg-muted transition-colors data-[resize-handle-state=drag]:bg-muted-foreground" />
        <Panel defaultSize={60} minSize={40}>
           <div className="h-full overflow-y-auto pl-4">
            {selectedForm ? (
                    <FormEditor 
                        key={selectedForm.id}
                        form={selectedForm}
                        onFormUpdated={handleFormUpdate}
                        onDeleteForm={() => setFormToDelete(selectedForm)}
                    />
            ) : (
                    <Card className="h-full flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                            <p>Select a form to view and edit its details.</p>
                        </div>
                    </Card>
            )}
           </div>
        </Panel>
       </PanelGroup>

    </div>
  );
}
