
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
import { useSecureFetch } from '@/hooks/use-secure-fetch';

export type Template = {
  id: string;
  name: string;
  subject: string;
  body: string;
  placeholders: string[];
};

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const secureFetch = useSecureFetch();

  const fetchTemplates = async () => {
    setLoading(true);
    try {
        const res = await secureFetch('/api/admin/email-templates');
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        
        setTemplates(data.templates);
        if (!selectedTemplate && data.templates.length > 0) {
            setSelectedTemplate(data.templates[0]);
        } else if (selectedTemplate) {
            setSelectedTemplate(prev => data.templates.find((t: Template) => t.id === prev?.id) || data.templates[0] || null);
        }
    } catch (err: any) {
        toast({
            title: "Error",
            description: "Could not fetch email templates: " + err.message,
            variant: "destructive"
        })
    } finally {
        setLoading(false);
    }
  }

  useEffect(() => {
    fetchTemplates();
  }, [secureFetch]);
  
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
                        onTemplateUpdated={fetchTemplates}
                    />
            ) : (
                    <Card className="h-full flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                            {loading ? <p>Loading...</p> : <p>Select a template to begin editing.</p>}
                        </div>
                    </Card>
            )}
           </div>
        </Panel>
       </PanelGroup>

    </div>
  );
}
