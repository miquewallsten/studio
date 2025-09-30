
'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

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

interface UserProfileSheetProps {
  user: User | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileSheet({ user, isOpen, onOpenChange }: UserProfileSheetProps) {
    if (!user) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>User Profile</SheetTitle>
                    <SheetDescription>
                        Manage user details, roles, and permissions.
                    </SheetDescription>
                </SheetHeader>
                <div className="py-6 space-y-6">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={user.photoURL} alt={user.displayName} />
                            <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-lg font-semibold">{user.displayName || user.email}</h2>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Role</span>
                                <Badge variant={user.role === 'Unassigned' ? 'destructive' : 'secondary'}>{user.role}</Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Tenant</span>
                                <span>{user.tenantName || 'N/A'}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">User ID</span>
                                <span className="font-mono text-xs bg-muted p-1 rounded">{user.uid}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Created At</span>
                                <span>{format(new Date(user.createdAt), 'PPP')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Status</span>
                                <Badge variant={user.disabled ? 'destructive' : 'default'}>{user.disabled ? 'Disabled' : 'Active'}</Badge>
                            </div>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle>Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="outline" className="w-full">Change Role</Button>
                            <Button variant="outline" className="w-full">Assign to Tenant</Button>
                            <Button variant="destructive" className="w-full">
                                {user.disabled ? 'Enable User' : 'Disable User'}
                            </Button>
                        </CardContent>
                    </Card>

                </div>
            </SheetContent>
        </Sheet>
    );
}
