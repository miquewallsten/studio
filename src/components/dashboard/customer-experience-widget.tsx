
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Star, Smile, Frown, Lightbulb, User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '../ui/badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type LowRatedTicket = {
  id: string;
  subjectName: string;
  rating: number;
  ratingSubmittedAt: Timestamp;
};

type Feedback = {
    id: string;
    category: 'Complaint' | 'Suggestion' | 'Other';
    summary: string;
    userName: string;
    createdAt: Timestamp;
}

export function CustomerExperienceWidget() {
  const [lowRated, setLowRated] = useState<LowRatedTicket[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ratingsQuery = query(
      collection(db, 'tickets'),
      where('rating', '<=', 3),
      orderBy('rating', 'asc'),
      limit(10)
    );

    const feedbackQuery = query(
        collection(db, 'feedback'),
        orderBy('createdAt', 'desc'),
        limit(10)
    );

    const unsubscribeRatings = onSnapshot(ratingsQuery, (snapshot) => {
      const tickets: LowRatedTicket[] = [];
      snapshot.forEach(doc => tickets.push({ id: doc.id, ...doc.data() } as LowRatedTicket));
      setLowRated(tickets);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching low ratings:", error);
        // Don't crash the widget if the index is missing.
        setLoading(false);
    });

    const unsubscribeFeedback = onSnapshot(feedbackQuery, (snapshot) => {
        const feedbackItems: Feedback[] = [];
        snapshot.forEach(doc => feedbackItems.push({id: doc.id, ...doc.data()} as Feedback));
        setFeedback(feedbackItems);
        setLoading(false);
    });

    return () => {
        unsubscribeRatings();
        unsubscribeFeedback();
    };
  }, []);

  const getCategoryIcon = (category: string) => {
      switch(category) {
          case 'Complaint': return <Frown className="size-4 text-destructive" />;
          case 'Suggestion': return <Lightbulb className="size-4 text-blue-500" />;
          default: return <MessageSquare className="size-4" />;
      }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="non-draggable">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
                <Smile className="text-accent" />
                Customer Experience
            </CardTitle>
            <CardDescription>
              An overview of recent client ratings and feedback.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0 non-draggable">
        <Tabs defaultValue="low-ratings" className="h-full flex flex-col">
            <TabsList className="mx-6">
                <TabsTrigger value="low-ratings">Low Ratings</TabsTrigger>
                <TabsTrigger value="feedback">Feedback</TabsTrigger>
            </TabsList>
            <TabsContent value="low-ratings" className="flex-1 overflow-hidden mt-0">
                <ScrollArea className="h-full">
                    <div className="p-6 pt-2">
                    {loading ? (
                        <p className="text-sm text-muted-foreground text-center py-4">Loading ratings...</p>
                    ) : lowRated.length === 0 ? (
                        <div className="text-center text-sm text-muted-foreground py-10">
                            <p>No low ratings recently.</p>
                            <p className="text-xs">Keep up the great work!</p>
                        </div>
                    ) : (
                        <ul className="space-y-3">
                            {lowRated.map((ticket) => (
                                <li key={ticket.id} className="flex items-center justify-between rounded-md border p-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={cn("size-4", i < ticket.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300')} />
                                                ))}
                                            </div>
                                            <p className="font-semibold text-destructive">{ticket.subjectName}</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Rated {ticket.ratingSubmittedAt ? formatDistanceToNow(ticket.ratingSubmittedAt.toDate(), { addSuffix: true }) : ''}
                                        </p>
                                    </div>
                                    <Button asChild size="sm" variant="secondary">
                                        <Link href={`/dashboard/tickets/${ticket.id}`}>View Ticket</Link>
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                    </div>
                </ScrollArea>
            </TabsContent>
             <TabsContent value="feedback" className="flex-1 overflow-hidden mt-0">
                <ScrollArea className="h-full">
                    <div className="p-6 pt-2">
                    {loading ? (
                        <p className="text-sm text-muted-foreground text-center py-4">Loading feedback...</p>
                    ) : feedback.length === 0 ? (
                        <div className="text-center text-sm text-muted-foreground py-10">
                            <p>No feedback submitted yet.</p>
                        </div>
                    ) : (
                         <ul className="space-y-3">
                            {feedback.map((item) => (
                                <li key={item.id} className="rounded-md border p-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            {getCategoryIcon(item.category)}
                                            <Badge variant={item.category === 'Complaint' ? 'destructive' : 'secondary'}>{item.category}</Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true })}</p>
                                    </div>
                                    <p className="text-sm my-2">{item.summary}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <User className="size-3" /> <span>{item.userName}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                    </div>
                </ScrollArea>
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
