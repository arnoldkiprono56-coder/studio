
'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, where, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Percent } from 'lucide-react';
import { useMemo } from 'react';
import type { Prediction } from '@/lib/types';
import { TrendingUp, TrendingDown } from 'lucide-react';


export function PredictionSuccessRate() {
    const firestore = useFirestore();

    const resolvedPredictionsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return query(
            collectionGroup(firestore, 'predictions'),
            where('status', 'in', ['won', 'lost']),
            where('timestamp', '>=', Timestamp.fromDate(thirtyDaysAgo))
        );
    }, [firestore]);

    const { data: predictions, isLoading } = useCollection<Prediction>(resolvedPredictionsQuery);

    const stats = useMemo(() => {
        if (!predictions || predictions.length === 0) {
            return { total: 0, wins: 0, losses: 0, winRate: 0 };
        }
        const total = predictions.length;
        const wins = predictions.filter(p => p.status === 'won').length;
        const losses = total - wins;
        const winRate = (wins / total) * 100;
        return { total, wins, losses, winRate: Math.round(winRate) };
    }, [predictions]);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Percent className="h-6 w-6 text-muted-foreground" />
                    <CardTitle>Prediction Success</CardTitle>
                </div>
                <CardDescription>Win/loss ratio for all predictions in the last 30 days.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-1/2" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                ) : stats.total > 0 ? (
                    <div className="space-y-4">
                        <div className="text-center">
                            <p className="text-muted-foreground">Overall Win Rate</p>
                            <p className="text-4xl font-bold text-primary">{stats.winRate}%</p>
                        </div>
                        <div className="flex justify-around text-center">
                            <div>
                                <p className="text-lg font-bold flex items-center gap-1 text-success"><TrendingUp/> Wins</p>
                                <p className="text-2xl font-bold">{stats.wins}</p>
                            </div>
                            <div>
                                <p className="text-lg font-bold flex items-center gap-1 text-destructive"><TrendingDown/> Losses</p>
                                <p className="text-2xl font-bold">{stats.losses}</p>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground text-center pt-2">Based on {stats.total} resolved predictions.</p>
                    </div>
                ) : (
                     <div className="text-center h-[200px] flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/30 rounded-lg">
                        <AlertCircle className="h-8 w-8" />
                        <h3 className="font-semibold text-lg text-foreground">Not Enough Data</h3>
                        <p className="text-sm">No resolved predictions found in the last 30 days.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

