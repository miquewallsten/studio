
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, UserPlus, X } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  writeBatch,
  addDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

type Analyst = {
  uid: string;
  email: string;
  displayName: string;
};

type Group = {
  id: string;
  name: string;
  analystUids: string[];
};

export default function TeamsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [allAnalysts, setAllAnalysts] = useState<Analyst[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState('');
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch all analysts
    const analystsQuery = query(
      collection(db, 'users'),
      where('role', '==', 'Analyst')
    );
    const unsubscribeAnalysts = onSnapshot(analystsQuery, (snapshot) => {
      const analystsData = snapshot.docs.map(
        (doc) => ({ uid: doc.id, ...doc.data() } as Analyst)
      );
      setAllAnalysts(analystsData);
    });

    // Fetch all expertise groups
    const groupsQuery = query(collection(db, 'expertise_groups'));
    const unsubscribeGroups = onSnapshot(groupsQuery, (snapshot) => {
      const groupsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        analystUids: doc.data().analystUids || [],
      }));
      setGroups(groupsData);
      setLoading(false);
    });

    return () => {
      unsubscribeAnalysts();
      unsubscribeGroups();
    };
  }, []);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast({
        title: 'Error',
        description: 'Group name cannot be empty.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await addDoc(collection(db, 'expertise_groups'), {
        name: newGroupName,
        analystUids: [],
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Group Created', description: `"${newGroupName}" has been created.` });
      setNewGroupName('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;
    try {
      await deleteDoc(doc(db, 'expertise_groups', groupToDelete.id));
      toast({
        title: 'Group Deleted',
        description: `"${groupToDelete.name}" has been deleted.`,
      });
      setGroupToDelete(null);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleAnalystAssignment = async (
    group: Group,
    analyst: Analyst,
    assign: boolean
  ) => {
    const groupRef = doc(db, 'expertise_groups', group.id);
    let updatedUids;
    if (assign) {
      updatedUids = [...group.analystUids, analyst.uid];
    } else {
      updatedUids = group.analystUids.filter((uid) => uid !== analyst.uid);
    }

    try {
      const batch = writeBatch(db);
      batch.update(groupRef, { analystUids: updatedUids });
      await batch.commit();
      toast({
        title: 'Team Updated',
        description: `${analyst.displayName} has been ${
          assign ? 'added to' : 'removed from'
        } ${group.name}.`,
      });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  if (loading) {
    return <p>Loading teams and analysts...</p>;
  }

  return (
    <div className="flex-1 space-y-4">
      <AlertDialog
        open={!!groupToDelete}
        onOpenChange={(open) => !open && setGroupToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the "{groupToDelete?.name}" group. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGroup}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Teams</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Create New Expertise Group</CardTitle>
          <CardDescription>
            Create a new group to organize analysts by their expertise.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            placeholder="e.g., Compliance, Financial Screening"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <Button onClick={handleCreateGroup}>
            <PlusCircle className="mr-2" />
            Create Group
          </Button>
        </CardContent>
      </Card>
      <div className="space-y-6">
        {groups.map((group) => (
          <Card key={group.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{group.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <AddAnalystPopover
                    group={group}
                    allAnalysts={allAnalysts}
                    onAssign={handleAnalystAssignment}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setGroupToDelete(group)}
                  >
                    <Trash2 className="text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {group.analystUids.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No analysts in this group yet.
                </p>
              ) : (
                <div className="flex flex-wrap gap-4">
                  {group.analystUids.map((uid) => {
                    const analyst = allAnalysts.find((a) => a.uid === uid);
                    if (!analyst) return null;
                    return (
                      <div
                        key={uid}
                        className="flex items-center gap-2 rounded-full border p-1 pr-3"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>
                            {analyst.displayName?.[0] || analyst.email[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {analyst.displayName || analyst.email}
                        </span>
                        <button
                          onClick={() => handleAnalystAssignment(group, analyst, false)}
                        >
                          <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AddAnalystPopover({
  group,
  allAnalysts,
  onAssign,
}: {
  group: Group;
  allAnalysts: Analyst[];
  onAssign: (group: Group, analyst: Analyst, assign: boolean) => void;
}) {
  const availableAnalysts = useMemo(
    () => allAnalysts.filter((a) => !group.analystUids.includes(a.uid)),
    [allAnalysts, group.analystUids]
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline">
          <UserPlus className="mr-2" />
          Add Analyst
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandInput placeholder="Search analysts..." />
          <CommandList>
            <CommandEmpty>No analysts found.</CommandEmpty>
            <CommandGroup>
              {availableAnalysts.map((analyst) => (
                <CommandItem
                  key={analyst.uid}
                  onSelect={() => onAssign(group, analyst, true)}
                  className="flex items-center gap-2"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>
                      {analyst.displayName?.[0] || analyst.email[0]}
                    </AvatarFallback>
                  </Avatar>
                  {analyst.displayName || analyst.email}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
