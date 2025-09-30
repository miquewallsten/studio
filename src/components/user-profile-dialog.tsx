
'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Briefcase, KeyRound, Ticket, UserCheck, Mail, Phone, User as UserIcon, Calendar, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { signInWithCustomToken } from 'firebase/auth';
import { Separator } from './ui/separator';

type User = {
    uid: string;
    email?: string;
    displayName?: string;
    photoURL?: string;
    disabled: boolean;
    tenantId?: string;
    tenantName?: string | null;
    role: string;
    createdAt: string;
}

interface UserProfileDialogProps {
  user: User | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileDialog({ user, isOpen, onOpenChange }: UserProfileDialogProps) {
    const { toast } = useToast();

    if (!user) return null;

    const handleImpersonate = async () => {
        try {
            const res = await fetch('/api/auth/impersonate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUid: user.uid }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to start impersonation');
            }
            
            await auth.signOut();
            await signInWithCustomToken(auth, data.customToken);

            toast({
                title: 'Impersonation Started',
                description: `You are now logged in as ${user.email || 'user'}.`,
            });
            
            onOpenChange(false);
            if (user.role.startsWith('Tenant') || user.role === 'End User') {
                 window.location.href = '/client/dashboard';
            } else {
                 window.location.href = '/dashboard';
            }
            
        } catch (err: any) {
            toast({
                title: 'Impersonation Failed',
                description: err.message,
                variant: 'destructive',
            });
        }
    };


    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? ''} />
                            <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <DialogTitle className="text-xl font-bold font-headline">{user.displayName || user.email}</DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground">{user.email}</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-6">
                        <Card>
                             <CardHeader>
                                <CardTitle>Admin Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button variant="outline" className="w-full">Change Role</Button>
                                <Button variant="outline" className="w-full">Assign Tenant</Button>
                                <Button variant="destructive" className="w-full">
                                    {user.disabled ? 'Enable User' : 'Disable User'}
                                </Button>
                                <Button onClick={handleImpersonate} className="w-full bg-accent hover:bg-accent/90">
                                    <UserCheck className="mr-2 size-4" /> Impersonate
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                         <Card>
                            <CardHeader>
                                <CardTitle>Details</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center gap-2"><UserIcon className="size-4"/> Full Name</span>
                                    <span>{user.displayName || 'Not set'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center gap-2"><Mail className="size-4"/> Email</span>
                                    <span>{user.email}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center gap-2"><Phone className="size-4"/> Phone</span>
                                    <span className="text-muted-foreground">Not set</span>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center gap-2"><KeyRound className="size-4"/> Role</span>
                                    <Badge variant={user.role === 'Unassigned' ? 'destructive' : 'secondary'}>{user.role}</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center gap-2"><Briefcase className="size-4"/> Tenant</span>
                                    <span>{user.tenantName || 'Internal Staff'}</span>
                                </div>
                                <Separator />
                                 <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center gap-2"><Info className="size-4" /> User ID</span>
                                    <span className="font-mono text-xs bg-muted p-1 rounded">{user.uid}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center gap-2"><Calendar className="size-4" /> Created At</span>
                                    <span>{format(new Date(user.createdAt), 'PPP')}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center gap-2"><Info className="size-4" /> Status</span>
                                    <Badge variant={user.disabled ? 'destructive' : 'default'}>{user.disabled ? 'Disabled' : 'Active'}</Badge>
                                </div>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>User Activity</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-4">
                               <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center gap-2"><Ticket className="size-4"/> Tickets Created</span>
                                    <span className="font-bold">0</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
