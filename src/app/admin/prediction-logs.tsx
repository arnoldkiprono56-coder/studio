'use client';

import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, orderBy } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Prediction } from '@/lib/types';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

export function PredictionLogs() {
    const firestore = useFirestore();
    
    const predictionsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collectionGroup(firestore, 'predictions'), orderBy('timestamp', 'desc'));
    }, [firestore]);

    const { data: predictions, isLoading } = useCollection<Prediction>(predictionsQuery);
    
    const [userIdFilter, setUserIdFilter] = useState('');
    const [gameTypeFilter, setGameTypeFilter] = useState('');

    const filteredPredictions = predictions?.filter(prediction => {
        return (
            (userIdFilter ? prediction.userId.toLowerCase().includes(userIdFilter.toLowerCase()) : true) &&
            (gameTypeFilter ? prediction.gameType.toLowerCase().includes(gameTypeFilter.toLowerCase()) : true)
        );
    });

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <History className="h-6 w-6 text-muted-foreground" />
                    <CardTitle>Global Prediction Logs</CardTitle>
                </div>
                <CardDescription>View all prediction requests made across the platform.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 border rounded-lg">
                    <Input
                        placeholder="Filter by User ID..."
                        value={userIdFilter}
                        onChange={e => setUserIdFilter(e.target.value)}
                    />
                    <Input
                        placeholder="Filter by Game Type..."
                        value={gameTypeFilter}
                        onChange={e => setGameTypeFilter(e.target.value)}
                    />
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>User ID</TableHead>
                            <TableHead>Game Type</TableHead>
                            <TableHead>Prediction Data</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                </TableRow>
                            ))
                        ) : (
                            filteredPredictions?.map(log => (
                                <TableRow key={log.id}>
                                    <TableCell className="text-xs">{log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}</TableCell>
                                    <TableCell className="font-code text-xs">{log.userId}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{log.gameType}</Badge>
                                    </TableCell>
                                    <TableCell className="text-xs max-w-sm truncate" title={log.predictionData}>{log.predictionData}</TableCell>
                                </TableRow>
                            ))
                        )}
                        {!isLoading && (!filteredPredictions || filteredPredictions.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">
                                     <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                        <AlertCircle className="h-5 w-5" />
                                        No prediction logs found.
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
