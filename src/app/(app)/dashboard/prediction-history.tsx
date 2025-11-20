
'use client';

import { useCollection } from '@/firebase/firestore/use-collection';
import { useProfile } from '@/context/profile-context';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { Prediction } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, History, CircleCheck, CircleX, Hourglass } from 'lucide-react';

const statusConfig = {
    pending: { icon: Hourglass, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    won: { icon: CircleCheck, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    lost: { icon: CircleX, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export function PredictionHistory() {
    const { userProfile, isProfileLoading } = useProfile();
    const firestore = useFirestore();

    const predictionsQuery = useMemoFirebase(() => {
        if (!userProfile?.id || !firestore) return null;
        return query(
            collection(firestore, 'users', userProfile.id, 'predictions'),
            orderBy('timestamp', 'desc'),
            limit(10)
        );
    }, [userProfile?.id, firestore]);

    const { data: predictions, isLoading: predictionsLoading } = useCollection<Prediction>(predictionsQuery);
    const isLoading = isProfileLoading || predictionsLoading;

    return (
        <div>
            <h2 className="text-2xl font-semibold tracking-tight mb-4">Recent Predictions</h2>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="w-5 h-5" />
                        Prediction History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                                    <div className="space-y-2">
                                        <Skeleton className="h-5 w-48" />
                                        <Skeleton className="h-4 w-64" />
                                    </div>
                                    <Skeleton className="h-6 w-20 rounded-full" />
                                </div>
                            ))}
                        </div>
                    ) : predictions && predictions.length > 0 ? (
                        <ul className="space-y-4">
                            {predictions.map((p) => {
                                const { icon: Icon, color } = statusConfig[p.status] || statusConfig.pending;
                                const predictionDate = p.timestamp?.toDate ? p.timestamp.toDate().toLocaleDateString() : 'N/A';
                                
                                return (
                                    <li key={p.id} className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-lg border ${color}`}>
                                        <div className="flex-grow">
                                            <p className="font-semibold">{p.gameType}</p>
                                            <p className="text-xs text-muted-foreground">{predictionDate}</p>
                                            {p.gameType === 'VIP Slip' && Array.isArray(p.predictionData) && (
                                                <div className="text-xs mt-2 space-y-1">
                                                    {p.predictionData.map((match: any, index: number) => (
                                                        <p key={index} className="truncate">
                                                           - {match.teams}: {match.prediction} @{match.odd}
                                                        </p>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <Badge variant="outline" className={`mt-2 sm:mt-0 capitalize flex items-center gap-1.5 ${color}`}>
                                            <Icon className="w-3.5 h-3.5" />
                                            {p.status}
                                        </Badge>
                                    </li>
                                )
                            })}
                        </ul>
                    ) : (
                        <div className="text-center h-24 flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/30 rounded-lg">
                            <AlertCircle className="h-8 w-8" />
                            <p className="text-sm font-medium">No predictions made yet.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

    