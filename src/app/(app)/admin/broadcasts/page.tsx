
'use client';

import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, startAfter, DocumentSnapshot, DocumentData } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Megaphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';


interface Notification {
    id: string;
    message: string;
    targetAudience: 'all' | 'premium' | 'staff';
    senderEmail: string;
    createdAt: any;
}

const PAGE_SIZE = 5;

export default function BroadcastLogPage() {
    const firestore = useFirestore();
    const [lastVisible, setLastVisible] = useState<DocumentSnapshot<DocumentData> | null>(null);
    const [page, setPage] = useState(1);
    const [paginationHistory, setPaginationHistory] = useState<(DocumentSnapshot<DocumentData> | null)[]>([null]);


    const notificationsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        let q = query(
            collection(firestore, 'notifications'),
            orderBy('createdAt', 'desc'),
            limit(PAGE_SIZE)
        );
        const cursor = paginationHistory[page - 1];
        if (cursor) {
            q = query(q, startAfter(cursor));
        }
        return q;
    }, [firestore, page, paginationHistory]);

    const { data: notifications, isLoading } = useCollection<Notification>(notificationsQuery);
    
    useState(() => {
        if (!isLoading && notifications && notifications.length > 0) {
            const newLast = (notificationsQuery as any)?.__private_internal_snapshot?.docs[notifications.length - 1];
            setLastVisible(newLast || null);
        }
    });

    const goToNextPage = () => {
        if (lastVisible) {
            setPaginationHistory(prev => [...prev, lastVisible]);
            setPage(prev => prev + 1);
        }
    };

    const goToPreviousPage = () => {
        if (page > 1) {
            setPaginationHistory(prev => prev.slice(0, -1));
            setPage(prev => prev - 1);
        }
    };


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
                <div className="flex items-center justify-end space-x-2 pt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPreviousPage}
                        disabled={page <= 1}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNextPage}
                        disabled={!notifications || notifications.length < PAGE_SIZE}
                    >
                        Next
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
