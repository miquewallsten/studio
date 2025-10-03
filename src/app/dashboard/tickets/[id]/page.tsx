
'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
  } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileUp, MessageSquare, Save, UserPlus, CheckCircle, Upload, Bot, EyeOff, Sparkles } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuthRole } from '@/hooks/use-auth-role';
import type { Field } from '@/app/dashboard/fields/schema';
import { useSecureFetch } from '@/hooks/use-secure-fetch';

type Ticket = {
  id: string;
  subjectName: string;
  reportType: string;
  status: string;
  createdAt: string; // ISO string
  description: string;
  clientEmail: string;
  formId?: string;
  formData?: { [key: string]: any };
  internalNotes?: { [key: string]: string };
  privateManagerNote?: string;
  reportUrl?: string;
};

type FormField = Field & {
    value?: any;
}

type ReportSection = {
    title: string;
    content: string;
    isGenerating?: boolean;
}


export default function TicketDetailPage({ params }: { params: { id: string } }) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [internalNotes, setInternalNotes] = useState<{ [key: string]: string }>({});
  const [privateManagerNote, setPrivateManagerNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [reportFile, setReportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();
  const { role } = useAuthRole();
  const [reportSections, setReportSections] = useState<ReportSection[]>([]);
  const secureFetch = useSecureFetch();

  const fetchFormFields = useCallback(async (formId: string, formData: {[key: string]: any}) => {
    try {
        const res = await secureFetch(`/api/forms/${formId}`);
        const data = await res.json();
        if (data.form && data.form.fields) {
            const fieldIds = data.form.fields;
            if (fieldIds.length === 0) {
                setFormFields([]);
                return;
            }
            
            const fieldsRes = await secureFetch(`/api/fields?ids=${fieldIds.join(',')}`);
            const fieldsData = await fieldsRes.json();
            
            const fields: Field[] = fieldsData.fields;
            const orderedFields = fieldIds.map((id: string) => {
                const fieldDef = fields.find(f => f.id === id);
                const value = formData[fieldDef?.label || ''];
                return { ...fieldDef, value };
            }).filter(Boolean) as FormField[];
            
            setFormFields(orderedFields);
            const sections = orderedFields.map(field => ({
                title: field.label,
                content: '',
            }));
            setReportSections(sections);
        }
    } catch(err: any) {
        toast({ title: "Error", description: `Could not fetch form fields: ${err.message}`, variant: "destructive"});
    }
  }, [secureFetch, toast]);

  const fetchTicket = useCallback(async () => {
    setLoading(true);
     try {
        const res = await secureFetch(`/api/tickets/${params.id}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        const fetchedTicket = data.ticket;
        setTicket(fetchedTicket);
        setInternalNotes(fetchedTicket.internalNotes || {});
        setPrivateManagerNote(fetchedTicket.privateManagerNote || '');

        if (fetchedTicket.formId && fetchedTicket.formData) {
            fetchFormFields(fetchedTicket.formId, fetchedTicket.formData);
        }
      } catch (error: any) {
        toast({ title: "Error", description: `Could not load ticket: ${error.message}`, variant: "destructive" });
      } finally {
        setLoading(false);
      }
  }, [params.id, secureFetch, toast, fetchFormFields]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);
  
  const handleNoteChange = (fieldName: string, value: string) => {
    setInternalNotes(prev => ({...prev, [fieldName]: value}));
  }

  const handleSaveNotes = async () => {
    if (!ticket) return;
    setIsSaving(true);
    try {
        await secureFetch(`/api/tickets/${ticket.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
                internalNotes: internalNotes,
                privateManagerNote: privateManagerNote
            }),
        });
        toast({
            title: 'Notes Saved',
            description: 'Your internal notes have been successfully saved.',
        })
    } catch (error: any) {
        toast({
            title: 'Error Saving Notes',
            description: error.message || 'An unknown error occurred.',
            variant: 'destructive'
        })
    } finally {
        setIsSaving(false);
    }
  }
  
  const handleRunValidations = async () => {
      if (!ticket) return;
      setIsValidating(true);
      toast({
          title: "AI Validations Started",
          description: "The AI is now running validations. Notes will appear as they are completed."
      });
      try {
        // This is a simulation, as the original Genkit flow with tools was removed.
        console.log("Simulating AI Validations for ticket:", ticket.id);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const firstField = formFields[0];
        if (firstField) {
            handleNoteChange(firstField.label, "AI validation: Data appears to be consistent.");
        }

        toast({
            title: "AI Validations Complete (Simulated)",
            description: "Please review the updated notes.",
            variant: 'default'
        });

      } catch (error: any) {
           toast({
                title: "AI Validation Error",
                description: error.message,
                variant: 'destructive'
            });
      } finally {
          setIsValidating(false);
      }
  }
  
  const handleGenerateSection = async (sectionIndex: number) => {
    if (!ticket) return;
    
    setReportSections(prev => prev.map((s, i) => i === sectionIndex ? {...s, isGenerating: true} : s));

    const section = reportSections[sectionIndex];
    const field = formFields[sectionIndex];
    const relevantNote = internalNotes[field.label] || '';
    const relevantValue = field.value || '';
    const prompt = `You are an assistant to an analyst manager. Your job is to summarize report requests so that the manager can quickly understand the request and assign it to the appropriate analyst. Provide only a concise summary in plain text. Do not add a preamble or any extra formatting.

    Here are the details of the section to summarize:
    Section Title: "${section.title}"
    User-provided data for this section: ${relevantValue}
    Analyst notes for this section: ${relevantNote}
    `;

    try {
        const res = await fetch('/api/ai/echo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt }),
        });
        const json = await res.json();
        const result = json.text ?? '';
        
        setReportSections(prev => prev.map((s, i) => 
            i === sectionIndex ? {...s, content: result, isGenerating: false } : s
        ));

    } catch (error: any) {
        toast({ title: "AI Error", description: error.message, variant: "destructive" });
        setReportSections(prev => prev.map((s, i) => i === sectionIndex ? {...s, isGenerating: false} : s));
    }
  }
  
  const handleSectionContentChange = (index: number, content: string) => {
      setReportSections(prev => prev.map((s, i) => i === index ? {...s, content} : s));
  }

  const handleCompleteTicket = async () => {
    if (!ticket) return;
    setIsCompleting(true);
    try {
        await secureFetch(`/api/tickets/${ticket.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'Completed' }),
        });
         toast({
            title: 'Ticket Completed',
            description: 'This ticket has been marked as complete and is now available to the client.',
        });
        fetchTicket(); // Re-fetch to get latest status
    } catch (error: any) {
        toast({
            title: 'Error',
            description: 'Could not complete the ticket.',
            variant: 'destructive',
        })
    } finally {
        setIsCompleting(false);
    }
  }
  
  const handleUploadClick = () => {
      fileInputRef.current?.click();
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && ticket) {
        setReportFile(file);
        const fakeUrl = `/reports/${ticket.id}/${file.name}`;
         try {
            await secureFetch(`/api/tickets/${ticket.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ reportUrl: fakeUrl }),
            });
            toast({
                title: 'Report Uploaded',
                description: `${file.name} is now attached to the ticket.`
            });
            fetchTicket(); // Re-fetch to get latest status
        } catch (error: any) {
            toast({ title: "Error", description: 'Failed to upload report.', variant: "destructive" });
        }
    }
  }


  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'New': return 'destructive';
      case 'Completed': return 'default';
      default: return 'secondary';
    }
  }

  if (loading) {
    return (
        <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
            <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-1/4" />
                    </CardHeader>
                    <CardContent>
                         <Skeleton className="h-40 w-full" />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-1/2" />
                    </CardHeader>
                    <CardContent>
                         <Skeleton className="h-60 w-full" />
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-6">
                 <Card>
                    <CardHeader>
                         <Skeleton className="h-8 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
  }

  if (!ticket) {
    return <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">Ticket not found.</div>
  }

  const hasFormData = formFields.length > 0;
  const canViewPrivateNote = role === 'Super Admin' || role === 'Manager' || role === 'Analyst';

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="grid gap-1">
                <CardTitle className="text-2xl font-headline">
                  Investigation: {ticket.subjectName}
                </CardTitle>
                <CardDescription>
                  Ticket ID: {ticket.id.substring(0, 7)}
                </CardDescription>
              </div>
              <Badge className="text-sm" variant={getStatusVariant(ticket.status)}>
                {ticket.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h3 className="font-semibold text-muted-foreground">Requested By</h3>
                  <p>{ticket.clientEmail}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-muted-foreground">Requested On</h3>
                  <p>{ticket.createdAt ? format(new Date(ticket.createdAt), 'PPP') : ''}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-muted-foreground">Report Type</h3>
                  <p>{ticket.reportType}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-muted-foreground">Client Notes</h3>
                <p className="text-sm">
                  {ticket.description || 'No notes provided.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
              <CardTitle>Form Submission & Notes</CardTitle>
              <CardDescription>Data submitted by the end-user and internal notes from the analyst.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {hasFormData ? (
                    formFields.map((field) => (
                        <div key={field.id} className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">{field.label}</Label>
                                <div className="p-3 border rounded-md min-h-[100px] bg-muted/50">
                                    <p className="text-sm whitespace-pre-wrap">{field.value || <span className="text-muted-foreground">Not provided</span>}</p>
                                </div>
                                {field.internalFields && field.internalFields.map(internalField => (
                                    <div key={internalField.id} className="pt-2">
                                        <Label htmlFor={`internal-note-${internalField.id}`} className="text-xs text-muted-foreground">{internalField.label}</Label>
                                        <Textarea 
                                            id={`internal-note-${internalField.id}`} 
                                            placeholder={`Note for ${internalField.label}...`} 
                                            className="min-h-[60px] text-xs"
                                            value={internalNotes[internalField.label] || ''}
                                            onChange={(e) => handleNoteChange(internalField.label, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor={`note-${field.id}`}>Internal Analyst Notes</Label>
                                <Textarea 
                                    id={`note-${field.id}`} 
                                    placeholder="Add general notes for this field..." 
                                    className="min-h-[100px]"
                                    value={internalNotes[field.label] || ''}
                                    onChange={(e) => handleNoteChange(field.label, e.target.value)}
                                />
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed">
                        <p className="text-muted-foreground">The end-user has not submitted the form yet.</p>
                    </div>
                )}
            </CardContent>
            {hasFormData && (
                <CardFooter className="flex-col items-start gap-4">
                     {canViewPrivateNote && (
                        <div className="w-full space-y-2">
                             <Label htmlFor="private-note" className="flex items-center gap-2">
                                <EyeOff className="mr-2 size-4 text-destructive" />
                                Private Note for Manager
                            </Label>
                             <Textarea
                                id="private-note"
                                placeholder="This note is only visible to Managers and Super Admins."
                                value={privateManagerNote}
                                onChange={(e) => setPrivateManagerNote(e.target.value)}
                            />
                        </div>
                     )}
                     <Button onClick={handleSaveNotes} disabled={isSaving}>
                        <Save className="mr-2" />
                        {isSaving ? 'Saving...' : 'Save All Notes'}
                    </Button>
                </CardFooter>
            )}
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Report Workbench</CardTitle>
                <CardDescription>
                    Generate section summaries with AI and edit them to build the final report.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {reportSections.map((section, index) => (
                    <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                             <Label htmlFor={`report-section-${index}`} className="text-lg font-semibold">{section.title}</Label>
                             <Button size="sm" variant="ghost" onClick={() => handleGenerateSection(index)} disabled={section.isGenerating}>
                                 {section.isGenerating ? <Sparkles className="mr-2 size-4 animate-pulse" /> : <Sparkles className="mr-2 size-4" />}
                                 {section.isGenerating ? 'Generating...' : 'Generate with AI'}
                             </Button>
                        </div>
                        <Textarea 
                            id={`report-section-${index}`}
                            value={section.content}
                            onChange={(e) => handleSectionContentChange(index, e.target.value)}
                            placeholder={`Summary for ${section.title}...`}
                            className="min-h-32"
                        />
                    </div>
                ))}
            </CardContent>
        </Card>


        <Card>
          <CardHeader>
            <CardTitle>Activity Feed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-40 items-center justify-center rounded-md border border-dashed">
              <p className="text-sm text-muted-foreground flex items-center gap-2"><MessageSquare className="size-4" /> No activity yet.</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Analyst Actions</CardTitle>
            <CardDescription>
              For internal use by managers and analysts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <Button className="w-full" variant="outline" onClick={handleRunValidations} disabled={isValidating}>
                {isValidating ? <Bot className="mr-2 animate-spin" /> : <Bot className="mr-2" />}
                {isValidating ? 'AI is Validating...' : 'Run AI Validations'}
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <Button className="w-full" variant="outline" onClick={handleUploadClick} disabled={!!ticket.reportUrl}>
              <Upload className="mr-2 size-4" /> 
              {ticket.reportUrl ? 'Report Uploaded' : 'Upload Report'}
            </Button>
            {ticket.reportUrl && <p className="text-xs text-center text-muted-foreground truncate">File: {ticket.reportUrl}</p>}
            {role === 'Manager' || role === 'Super Admin' ? (
                <Button className="w-full" onClick={handleCompleteTicket} disabled={isCompleting || !ticket.reportUrl}>
                    <CheckCircle className="mr-2 size-4" />
                    {isCompleting ? 'Closing Ticket...' : 'Complete & Close Ticket'}
                </Button>
            ): null}
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">This section is role-restricted.</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
