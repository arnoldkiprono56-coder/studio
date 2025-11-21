
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Percent } from 'lucide-react';

export function PredictionSuccessRate() {
    // This component is temporarily disabled to prevent a Firestore internal SDK error
    // related to complex collectionGroup queries. To re-enable it, a composite index
    // would need to be created in the Firebase console for the 'predictions' collection group.
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
                <div className="text-center h-[200px] flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/30 rounded-lg">
                    <AlertCircle className="h-8 w-8" />
                    <h3 className="font-semibold text-lg text-foreground">Feature Temporarily Unavailable</h3>
                    <p className="text-sm">This chart requires a database index. To enable it, please create a composite index on the 'predictions' collection group in your Firebase console.</p>
                </div>
            </CardContent>
        </Card>
    );
}
