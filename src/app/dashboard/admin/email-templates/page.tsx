
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
import { PlusCircle, Search, Mail } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, setDoc, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { EmailTemplateEditor } from '@/components/email-template-editor';

export type Template = {
  id: string;
  name: string;
  subject: string;
  body: string;
  placeholders: string[];
};

const DEFAULT_TEMPLATES: Omit<Template, 'id'>[] = [
    {
        name: 'Tenant Admin Invitation',
        subject: 'Your Invitation to the TenantCheck Platform',
        body: 'Hello {{adminName}},\n\nYou have been invited to become an administrator for {{companyName}} on the TenantCheck platform.\n\nPlease use the following secure, single-use link to set up your account and get started:\n\n{{onboarding_link}}\n\nThis link will expire after its first use.\n\nWelcome aboard,\nThe TenantCheck Team',
        placeholders: ['{{adminName}}', '{{companyName}}', '{{onboarding_link}}']
    },
    {
        name: 'End-User Form Invitation',
        subject: 'Information Request for {{reportType}}',
        body: 'Hello {{subjectName}},\n\n{{clientName}} has requested that you complete a form for a {{reportType}}.\n\nPlease use the secure link below to set up your account and fill out the required information:\n\n{{action_link}}\n\nThis link is for single use only.\n\nThank you,\nThe TenantCheck Team',
        placeholders: ['{{subjectName}}', '{{clientName}}', '{{reportType}}', '{{action_link}}']
    }
];


export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, 'email_templates'), orderBy('name'));
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      if (querySnapshot.empty) {
        // Firestore is empty, so seed it with default templates
        const batch = getDocs(collection(db, 'email_templates')).then(async snapshot => {
            const batch = doc(db, 'email_templates', 'placeholder').firestore.batch();
            for (const template of DEFAULT_TEMPLATES) {
                const docId = template.name.toLowerCase().replace(/\s+/g, '-');
                const docRef = doc(db, 'email_templates', docId);
                batch.set(docRef, template);
            }
            await batch.commit();
        });
        return; // The snapshot listener will fire again with the new data
      }

      const templatesData: Template[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        templatesData.push({
          id: doc.id,
          name: data.name,
          subject: data.subject,
          body: data.body,
          placeholders: data.placeholders || []
        });
      });
      setTemplates(templatesData);
      if (selectedTemplate) {
        setSelectedTemplate(prev => templatesData.find(t => t.id === prev?.id) || null);
      }
      setLoading(false);
    }, (error) => {
        console.error("Error fetching email templates:", error);
        toast({
            title: "Error",
            description: "Could not fetch email templates.",
            variant: "destructive"
        })
        setLoading(false);
    });

    return () => unsubscribe();
  }, [toast, selectedTemplate]);
  
  const filteredTemplates = useMemo(() => {
    if (!searchQuery) return templates;
    return templates.filter(template => template.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [templates, searchQuery]);

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh_-_8rem)]">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Email Templates</h1>
      </div>

       <PanelGroup direction="horizontal" className="flex-1">
        <Panel defaultSize={30} minSize={25}>
            <Card className="h-full flex flex-col">
                <CardHeader>
                    <CardTitle>System Emails</CardTitle>
                    <CardDescription>
                        Select a template to view and edit its content.
                    </CardDescription>
                    <div className="relative pt-2">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search templates..."
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
                          <p className="text-muted-foreground text-sm p-4">Loading templates...</p>
                      ) : (
                        <div className="space-y-2">
                          {filteredTemplates.map(template => (
                            <button
                              key={template.id}
                              onClick={() => setSelectedTemplate(template)}
                              className={cn(
                                "w-full text-left p-3 rounded-lg border flex justify-between items-center transition-colors",
                                selectedTemplate?.id === template.id 
                                  ? "bg-muted border-primary" 
                                  : "hover:bg-muted/50"
                              )}
                            >
                              <span className="font-medium flex items-center gap-2">
                                <Mail className="size-4 text-muted-foreground" /> {template.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                      {!loading && filteredTemplates.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-10">No templates found.</p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
            </Card>
        </Panel>
        <PanelResizeHandle className="w-2 bg-transparent hover:bg-muted transition-colors data-[resize-handle-state=drag]:bg-muted-foreground" />
        <Panel defaultSize={70} minSize={50}>
           <div className="h-full overflow-y-auto pl-4">
            {selectedTemplate ? (
                    <EmailTemplateEditor 
                        key={selectedTemplate.id}
                        template={selectedTemplate}
                    />
            ) : (
                    <Card className="h-full flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                            <p>Select a template to begin editing.</p>
                        </div>
                    </Card>
            )}
           </div>
        </Panel>
       </PanelGroup>

    </div>
  );
}
