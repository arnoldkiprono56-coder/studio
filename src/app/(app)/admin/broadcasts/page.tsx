
'use client';

import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Megaphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';


interface Notification {
    id: string;
    message: string;
    targetAudience: 'all' | 'premium' | 'staff';
    senderEmail: string;
    createdAt: any;
}

export default function BroadcastLogPage() {
    const firestore = useFirestore();

    const notificationsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'notifications'),
            orderBy('createdAt', 'desc')
        );
    }, [firestore]);

    const { data: notifications, isLoading } = useCollection<Notification>(notificationsQuery);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Megaphone className="h-6 w-6 text-muted-foreground" />
                    <CardTitle>Broadcast History</CardTitle>
                </div>
                <CardDescription>A log of all broadcast messages sent to users.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="border p-4 rounded-lg space-y-2">
                                <div className="flex justify-between items-start">
                                    <Skeleton className="h-5 w-1/4" />
                                    <Skeleton className="h-6 w-20" />
                                </div>
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                        ))
                    ) : notifications && notifications.length > 0 ? (
                        notifications.map(notification => (
                            <div key={notification.id} className="border p-4 rounded-lg bg-card-foreground/5">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="text-sm text-muted-foreground">
                                        Sent by <span className="font-semibold text-foreground">{notification.senderEmail}</span> on {notification.createdAt?.toDate().toLocaleString() || 'N/A'}
                                    </div>
                                    <Badge variant="secondary" className="capitalize">{notification.targetAudience}</Badge>
                                </div>
                                <div className="prose prose-sm prose-invert max-w-none">
                                    <ReactMarkdown>{notification.message}</ReactMarkdown>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center h-48 flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/30 rounded-lg">
                            <AlertCircle className="h-8 w-8" />
                            <h3 className="font-semibold text-lg text-foreground">No Broadcasts Found</h3>
                            <p className="text-sm">No messages have been sent yet.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
