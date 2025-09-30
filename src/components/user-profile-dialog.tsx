

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
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Briefcase, KeyRound, Ticket, Edit, Mail, Phone, User as UserIcon, Calendar, Info, Tag, X, Check, ChevronsUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from './ui/separator';
import { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ChangeRoleDialog } from './change-role-dialog';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { cn } from '@/lib/utils';
import { auth } from '@/lib/firebase';
import { getIdToken } from 'firebase/auth';
import { useAuthRole } from '@/hooks/use-auth-role';

type User = {
    uid: string;
    email?: string;
    displayName?: string;
    phone?: string;
    photoURL?: string;
    disabled: boolean;
    tenantId?: string;
    tenantName?: string | null;
    role: string;
    tags?: string[];
    createdAt: string;
    ticketsCreated?: number;
}

interface UserProfileDialogProps {
  user: User | null;
  allTags: string[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: () => void;
}

export function UserProfileDialog({ user, allTags, isOpen, onOpenChange, onUserUpdated }: UserProfileDialogProps) {
    const { toast } = useToast();
    const { role: currentUserRole } = useAuthRole();
    const [isEditMode, setIsEditMode] = useState(false);
    const [isChangeRoleOpen, setChangeRoleOpen] = useState(false);
    const [formData, setFormData] = useState({
        displayName: user?.displayName || '',
        phone: user?.phone || '',
        tags: user?.tags || [] as string[],
    });

    // For the multi-select combobox
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) {
            setFormData({
                displayName: user.displayName || '',
                phone: user.phone || '',
                tags: user.tags || [],
            });
            setIsEditMode(false); // Reset edit mode when user changes
        }
    }, [user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveChanges = async () => {
        if (!user) return;
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error("Not authenticated. Please log in again.");
            }
            const token = await getIdToken(currentUser);
            
            const payload = { ...formData };

            const res = await fetch(`/api/users/${user.uid}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });
            
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to update user');
            }

            toast({
                title: 'User Updated',
                description: 'The user profile has been successfully updated.',
            });
            onUserUpdated(); // Refresh the user list
            setIsEditMode(false); // Exit edit mode
            
        } catch (err: any) {
             toast({
                title: 'Update Failed',
                description: err.message,
                variant: 'destructive',
            });
        }
    };

    const handleCancelEdit = () => {
        // Reset form data to original user data
        if (user) {
            setFormData({
                displayName: user.displayName || '',
                phone: user.phone || '',
                tags: user.tags || [],
            });
        }
        setIsEditMode(false);
    };

    const handleTagSelect = (tag: string) => {
        const lowercasedTags = formData.tags.map(t => t.toLowerCase());
        if (!lowercasedTags.includes(tag.toLowerCase())) {
            setFormData(prev => ({...prev, tags: [...prev.tags, tag]}));
        }
        setInputValue("");
        inputRef.current?.blur();
        setOpen(false);
    }
    
    const handleTagCreate = (tagName: string) => {
        const newTag = tagName.trim();
        const lowercasedTags = formData.tags.map(t => t.toLowerCase());
        if (newTag && !lowercasedTags.includes(newTag.toLowerCase())) {
            setFormData(prev => ({...prev, tags: [...prev.tags, newTag]}));
        }
        setInputValue("");
        inputRef.current?.blur();
        setOpen(false);
    }

    const handleTagRemove = (tag: string) => {
        setFormData(prev => ({...prev, tags: prev.tags.filter(t => t !== tag)}));
    }

    const availableTags = React.useMemo(() => {
        const lowercasedSelectedTags = formData.tags.map(t => t.toLowerCase());
        return allTags.filter(tag => !lowercasedSelectedTags.includes(tag.toLowerCase()));
    }, [formData.tags, allTags]);
    
    const showCreateOption = inputValue && !availableTags.some(tag => tag.toLowerCase() === inputValue.toLowerCase()) && !formData.tags.some(tag => tag.toLowerCase() === inputValue.toLowerCase());

    if (!user) return null;


    return (
        <>
        <ChangeRoleDialog
            user={user}
            isOpen={isChangeRoleOpen}
            onOpenChange={setChangeRoleOpen}
            onRoleChanged={() => {
                onUserUpdated(); // Refresh main user list
                onOpenChange(false); // Close profile dialog
            }}
        />
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? ''} />
                            <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                             <DialogTitle className="text-xl font-bold font-headline">{isEditMode ? formData.displayName : user.displayName || user.email}</DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground">{user.email}</DialogDescription>
                        </div>
                         <Button variant="outline" size="icon" className="ml-auto" onClick={() => setIsEditMode(!isEditMode)}>
                            <Edit className="size-4" />
                            <span className="sr-only">Edit Profile</span>
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
                                <Button variant="outline" className="w-full justify-start" onClick={() => setChangeRoleOpen(true)}>Change Role</Button>
                                <Button variant="outline" className="w-full justify-start">Assign Tenant</Button>
                                <Button variant="destructive" className="w-full justify-start">
                                    {user.disabled ? 'Enable User' : 'Disable User'}
                                </Button>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>User Activity</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-4">
                               <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center gap-2"><Ticket className="size-4"/> Tickets Created</span>
                                    <span className="font-bold">{user.ticketsCreated || 0}</span>
                                </div>
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
                                {isEditMode ? (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="displayName">Full Name</Label>
                                            <Input id="displayName" name="displayName" value={formData.displayName} onChange={handleInputChange} />
                                        </div>
                                         <div className="grid gap-2">
                                            <Label htmlFor="phone">Phone</Label>
                                            <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Tags</Label>
                                            {currentUserRole === 'Super Admin' ? (
                                                <Popover open={open} onOpenChange={setOpen}>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            aria-expanded={open}
                                                            className="w-full justify-between h-auto min-h-10"
                                                        >
                                                            <div className="flex gap-1 flex-wrap">
                                                                {formData.tags.length > 0 ? formData.tags.map(tag => (
                                                                    <Badge key={tag} variant="secondary" className="mr-1">
                                                                        {tag}
                                                                        <div
                                                                            role="button"
                                                                            tabIndex={0}
                                                                            className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter' || e.key === ' ') {
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                    handleTagRemove(tag);
                                                                                }
                                                                            }}
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                handleTagRemove(tag);
                                                                            }}
                                                                        >
                                                                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                                                        </div>
                                                                    </Badge>
                                                                )) : <span className="text-muted-foreground">Select or create tags...</span>}
                                                            </div>
                                                            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                        <Command onKeyDown={(e) => { if (e.key === 'Enter' && showCreateOption) { e.preventDefault(); handleTagCreate(inputValue); } }}>
                                                            <CommandInput 
                                                                ref={inputRef}
                                                                value={inputValue}
                                                                onValueChange={setInputValue}
                                                                placeholder="Search or create tag..."
                                                            />
                                                            <CommandList>
                                                                <CommandEmpty>
                                                                    No results found.
                                                                </CommandEmpty>
                                                                <CommandGroup>
                                                                    {showCreateOption && (
                                                                        <CommandItem
                                                                            onSelect={() => handleTagCreate(inputValue)}
                                                                            value={`__create__${inputValue}`}
                                                                        >
                                                                            <Check className="mr-2 h-4 w-4 opacity-0" />
                                                                            Create "{inputValue}"
                                                                        </CommandItem>
                                                                    )}
                                                                    {availableTags.map((tag) => (
                                                                    <CommandItem
                                                                        key={tag}
                                                                        value={tag}
                                                                        onSelect={handleTagSelect}
                                                                    >
                                                                        <Check className={cn("mr-2 h-4 w-4", formData.tags.includes(tag) ? "opacity-100" : "opacity-0")} />
                                                                        {tag}
                                                                    </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                            ) : (
                                                <div className="flex flex-wrap gap-1 items-center min-h-10 rounded-md border border-input bg-background px-3 py-2">
                                                    {user.tags && user.tags.length > 0 ? user.tags.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>) : <span className="text-sm text-muted-foreground">No tags</span>}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground flex items-center gap-2"><UserIcon className="size-4"/> Full Name</span>
                                            <span>{user.displayName || 'Not set'}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground flex items-center gap-2"><Mail className="size-4"/> Email</span>
                                            <span className="truncate max-w-[200px]">{user.email}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground flex items-center gap-2"><Phone className="size-4"/> Phone</span>
                                            <span>{user.phone || 'Not set'}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground flex items-center gap-2"><Tag className="size-4"/> Tags</span>
                                            <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                                                {user.tags && user.tags.length > 0 ? user.tags.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>) : 'No tags'}
                                            </div>
                                        </div>
                                    </>
                                )}
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center gap-2"><KeyRound className="size-4"/> Role</span>
                                    <Badge variant={user.role === 'Unassigned' ? 'destructive' : 'secondary'}>{user.role}</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center gap-2"><Briefcase className="size-4"/> Tenant</span>
                                    <span>{user.tenantName || 'N/A'}</span>
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
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}





