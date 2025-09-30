
'use client';

import * as React from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { cn } from '@/lib/utils';
import { X, Check, ChevronsUpDown, Tag } from 'lucide-react';
import { useAuthRole } from '@/hooks/use-auth-role';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { getIdToken } from 'firebase/auth';

type User = {
    uid: string;
    tags?: string[];
}

interface InlineTagEditorProps {
    user: User;
    allTags: string[];
    onUserUpdated: () => void;
}

export function InlineTagEditor({ user, allTags, onUserUpdated }: InlineTagEditorProps) {
    const [selectedTags, setSelectedTags] = React.useState(user.tags || []);
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState("");
    const { role } = useAuthRole();
    const { toast } = useToast();
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        setSelectedTags(user.tags || []);
    }, [user.tags]);


    const saveTags = async (newTags: string[]) => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error("Not authenticated.");

            const token = await getIdToken(currentUser);

            const res = await fetch(`/api/users/${user.uid}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ tags: newTags }),
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update tags');
            
            toast({ title: 'Tags updated' });
            onUserUpdated();

        } catch (err: any) {
             toast({
                title: 'Update Failed',
                description: err.message,
                variant: 'destructive',
            });
            // Revert optimistic update
            setSelectedTags(user.tags || []);
        }
    }


    const handleTagSelect = (tag: string) => {
        const newTags = [...selectedTags, tag];
        setSelectedTags(newTags);
        saveTags(newTags);
        setInputValue("");
        setOpen(false);
    }
    
    const handleTagCreate = (tagName: string) => {
        const newTag = tagName.trim();
        const lowercasedTags = selectedTags.map(t => t.toLowerCase());
        if (newTag && !lowercasedTags.includes(newTag.toLowerCase())) {
            const newTags = [...selectedTags, newTag];
            setSelectedTags(newTags);
            saveTags(newTags);
        }
        setInputValue("");
        inputRef.current?.blur();
        setOpen(false);
    }

    const handleTagRemove = (tag: string) => {
        const newTags = selectedTags.filter(t => t !== tag);
        setSelectedTags(newTags);
        saveTags(newTags);
    }

    const availableTags = React.useMemo(() => {
        const lowercasedSelectedTags = selectedTags.map(t => t.toLowerCase());
        return allTags.filter(tag => !lowercasedSelectedTags.includes(tag.toLowerCase()));
    }, [selectedTags, allTags]);

    const showCreateOption = inputValue && !availableTags.some(tag => tag.toLowerCase() === inputValue.toLowerCase()) && !selectedTags.some(tag => tag.toLowerCase() === inputValue.toLowerCase());

    const isSuperAdmin = role === 'Super Admin';

    if (!isSuperAdmin) {
        return (
            <div className="flex flex-wrap gap-1">
                {selectedTags.length > 0 ? selectedTags.map(tag => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                )) : <span className="text-xs text-muted-foreground">No Tags</span>}
            </div>
        )
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div 
                    role="button" 
                    className="flex flex-wrap gap-1 items-center min-h-8 w-full cursor-pointer"
                    onClick={(e) => {
                        e.stopPropagation(); // prevent row click
                        setOpen(true);
                    }}
                >
                    {selectedTags.length > 0 ? selectedTags.map(tag => (
                        <Badge key={tag} variant="default" className="bg-slate-700 hover:bg-slate-600">
                            {tag}
                            <div
                                role="button"
                                tabIndex={0}
                                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); handleTagRemove(tag); } }}
                                onClick={(e) => { e.stopPropagation(); handleTagRemove(tag); }}
                            >
                                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            </div>
                        </Badge>
                    )) : <span className="text-xs text-muted-foreground pl-2">Add Tags...</span>}
                </div>
            </PopoverTrigger>
            <PopoverContent 
                className="w-[250px] p-0" 
                align="start"
                onClick={(e) => e.stopPropagation()} // Prevent popover from closing when clicking inside
            >
                <Command onKeyDown={(e) => { if (e.key === 'Enter' && showCreateOption) { e.preventDefault(); handleTagCreate(inputValue); } }}>
                    <CommandInput 
                        ref={inputRef}
                        value={inputValue}
                        onValueChange={setInputValue}
                        placeholder="Search or create tag..."
                    />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {showCreateOption && (
                                <CommandItem
                                    onSelect={() => handleTagCreate(inputValue)}
                                    value={`__create__${inputValue}`}
                                >
                                    Create "{inputValue}"
                                </CommandItem>
                            )}
                            {availableTags.map((tag) => (
                            <CommandItem
                                key={tag}
                                value={tag}
                                onSelect={() => handleTagSelect(tag)}
                            >
                                <Check className={cn("mr-2 h-4 w-4", selectedTags.includes(tag) ? "opacity-100" : "opacity-0")} />
                                {tag}
                            </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
