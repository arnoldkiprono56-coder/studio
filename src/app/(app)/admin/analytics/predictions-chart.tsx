
'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, BarChart2 } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import { useMemo } from 'react';
import type { Prediction } from '@/lib/types';


export function PredictionsChart() {
    const firestore = useFirestore();

    const predictionsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        // Query predictions from the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return query(
            collectionGroup(firestore, 'predictions'),
            where('timestamp', '>=', Timestamp.fromDate(sevenDaysAgo)),
            orderBy('timestamp', 'desc')
        );
    }, [firestore]);

    const { data: predictions, isLoading } = useCollection<Prediction>(predictionsQuery);

    const chartData = useMemo(() => {
        if (!predictions) return [];

        const dataByDay: { [key: string]: { date: string; 'VIP Slip': number; 'Aviator': number; 'Crash': number; 'Gems & Mines': number; } } = {};

        predictions.forEach(p => {
            const date = p.timestamp.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!dataByDay[date]) {
                dataByDay[date] = { date, 'VIP Slip': 0, 'Aviator': 0, 'Crash': 0, 'Gems & Mines': 0 };
            }
            if (p.gameType in dataByDay[date]) {
                 dataByDay[date][p.gameType as keyof typeof dataByDay[string]]++;
            }
        });

        return Object.values(dataByDay).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [predictions]);

    const chartConfig = {
        'VIP Slip': { label: 'VIP Slip', color: 'hsl(var(--chart-1))' },
        'Aviator': { label: 'Aviator', color: 'hsl(var(--chart-2))' },
        'Crash': { label: 'Crash', color: 'hsl(var(--chart-3))' },
        'Gems & Mines': { label: 'Gems & Mines', color: 'hsl(var(--chart-4))' },
    } as const;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <BarChart2 className="h-6 w-6 text-muted-foreground" />
                    <CardTitle>Recent Prediction Activity</CardTitle>
                </div>
                <CardDescription>Volume of predictions made in the last 7 days.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Skeleton className="h-[350px] w-full" />
                ) : predictions && predictions.length > 0 ? (
                    <ChartContainer config={chartConfig} className="min-h-[350px] w-full">
                        <BarChart accessibilityLayer data={chartData}>
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                            />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="VIP Slip" fill="var(--color-VIP Slip)" radius={4} />
                            <Bar dataKey="Aviator" fill="var(--color-Aviator)" radius={4} />
                            <Bar dataKey="Crash" fill="var(--color-Crash)" radius={4} />
                            <Bar dataKey="Gems & Mines" fill="var(--color-Gems & Mines)" radius={4} />
                        </BarChart>
                    </ChartContainer>
                ) : (
                    <div className="text-center h-[350px] flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/30 rounded-lg">
                        <AlertCircle className="h-8 w-8" />
                        <h3 className="font-semibold text-lg text-foreground">No Predictions Found</h3>
                        <p className="text-sm">No predictions have been made in the last 7 days.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
