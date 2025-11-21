
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Percent, Ticket, UserX, Loader2 } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { License } from '@/lib/types';


export function ActiveLicensesCard() {
    const firestore = useFirestore();

    // Note: This is a collection group query which requires an index.
    // In a real app, create a composite index on 'user_licenses' collection group: `isActive` ASC.
    const licensesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'user_licenses'), 
            where('isActive', '==', true)
        );
    }, [firestore]);

    // This query is likely to fail without an index. We will show a message.
    // A more robust solution would be a cloud function to aggregate this data.
    const { data: licenses, isLoading, error } = useCollection<License>(licensesQuery);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Ticket className="h-6 w-6 text-muted-foreground" />
                    <CardTitle>Active Licenses</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                 {isLoading ? (
                     <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 ) : error ? (
                     <div className="text-sm text-destructive flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        <p>Query failed. Index required.</p>
                     </div>
                 ) : (
                    <p className="text-4xl font-bold">{licenses?.length ?? 0}</p>
                )}
                <CardDescription>Total active game licenses.</CardDescription>
            </CardContent>
        </Card>
    );
}


export function SuspendedAccountsCard() {
    const firestore = useFirestore();

    const suspendedUsersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), where('isSuspended', '==', true));
    }, [firestore]);

    const { data: suspendedUsers, isLoading } = useCollection(suspendedUsersQuery);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <UserX className="h-6 w-6 text-muted-foreground" />
                    <CardTitle>Suspended</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : (
                    <p className="text-4xl font-bold">{suspendedUsers?.length ?? 0}</p>
                )}
                <CardDescription>Total suspended user accounts.</CardDescription>
            </CardContent>
        </Card>
    );
}
