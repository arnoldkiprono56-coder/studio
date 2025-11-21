
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, BarChart2 } from 'lucide-react';


export function PredictionsChart() {

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
                <div className="text-center h-[350px] flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/30 rounded-lg">
                    <AlertCircle className="h-8 w-8" />
                    <h3 className="font-semibold text-lg text-foreground">Feature Temporarily Unavailable</h3>
                    <p className="text-sm">This chart requires a database index. To enable it, please create a composite index on the 'predictions' collection group in your Firebase console.</p>
                </div>
            </CardContent>
        </Card>
    );
}
