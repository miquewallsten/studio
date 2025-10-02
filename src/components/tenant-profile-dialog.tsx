
'use client';

import * as React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
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
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Edit, Mail, Phone, Users, Calendar, Info, Trash2, Ticket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from './ui/separator';
import { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useSecureFetch } from '@/hooks/use-secure-fetch';

type Tenant = {
    id: string;
    name: string;
    createdAt: string;
    userCount: number;
    ticketsCreated: number;
}

interface TenantProfileDialogProps {
  tenant: Tenant | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onTenantUpdated: () => void;
}

export function TenantProfileDialog({ tenant, isOpen, onOpenChange, onTenantUpdated }: TenantProfileDialogProps) {
    const { toast } = useToast();
    const [isEditMode, setIsEditMode] = useState(false);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const secureFetch = useSecureFetch();
    
    const [formData, setFormData] = useState({
        name: '',
    });

    useEffect(() => {
        if (tenant) {
            setFormData({
                name: tenant.name || '',
            });
            setIsEditMode(false);
        }
    }, [tenant]);

    if (!tenant) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveChanges = async () => {
        toast({ title: 'Note', description: 'Editing tenant details is not implemented in this prototype.' });
        setIsEditMode(false);
    };

    const handleDeleteTenant = async () => {
        if (!tenant) return;
        try {
            await secureFetch(`/api/tenants/${tenant.id}`, {
                method: 'DELETE',
            });

            toast({
                title: 'Tenant Deleted',
                description: `Tenant "${tenant.name}" and all associated users have been deleted.`,
            });
            
            setDeleteDialogOpen(false);
            onOpenChange(false);
            onTenantUpdated();

        } catch (error: any) {
            toast({
                title: 'Deletion Failed',
                description: error.message,
                variant: 'destructive',
            });
        }
    }

    const handleCancelEdit = () => {
        if (tenant) {
            setFormData({
                name: tenant.name || '',
            });
        }
        setIsEditMode(false);
    };

    return (
        <>
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the tenant
                    <span className="font-bold">"{tenant.name}"</span> and all associated users and data.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteTenant} className="bg-destructive hover:bg-destructive/90">
                    Yes, delete tenant
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarFallback>{tenant.name?.[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                             <DialogTitle className="text-xl font-bold font-headline">{isEditMode ? formData.name : tenant.name}</DialogTitle>
                             <DialogDescription>Client Tenant Profile</DialogDescription>
                        </div>
                         <Button variant="outline" size="icon" className="ml-auto" onClick={() => setIsEditMode(!isEditMode)}>
                            <Edit className="size-4" />
                            <span className="sr-only">Edit Tenant</span>
                        </Button>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    {/* Left Column */}
                    <div className="space-y-6">
                        <Card>
                             <CardHeader>
                                <CardTitle>Admin Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button variant="outline" className="w-full justify-start">Invite User</Button>
                                <Button variant="destructive" className="w-full justify-start" onClick={() => setDeleteDialogOpen(true)}>
                                    <Trash2 className="mr-2 size-4" />
                                    Delete Tenant
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                         <Card>
                            <CardHeader>
                                <CardTitle>Details & Stats</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-4">
                                {isEditMode ? (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">Tenant Name</Label>
                                            <Input id="name" name="name" value={formData.name} onChange={handleInputChange} />
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground flex items-center gap-2"><Info className="size-4"/> Tenant Name</span>
                                        <span>{tenant.name || 'Not set'}</span>
                                    </div>
                                )}
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center gap-2"><Users className="size-4"/> Associated Users</span>
                                    <span className="font-bold">{tenant.userCount}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center gap-2"><Ticket className="size-4"/> Tickets Created</span>
                                     <span className="font-bold">{tenant.ticketsCreated}</span>
                                </div>
                                <Separator />
                                 <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center gap-2"><Info className="size-4" /> Tenant ID</span>
                                    <span className="font-mono text-xs bg-muted p-1 rounded">{tenant.id}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center gap-2"><Calendar className="size-4" /> Created At</span>
                                    <span>{format(new Date(tenant.createdAt), 'PPP')}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <DialogFooter>
                    {isEditMode ? (
                        <>
                            <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                            <Button onClick={handleSaveChanges}>Save Changes</Button>
                        </>
                    ) : (
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                    