
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, BarChart2, Loader2, Users } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';


export function TotalUsersCard() {
    const firestore = useFirestore();

    const usersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'));
    }, [firestore]);

    const { data: users, isLoading } = useCollection(usersQuery);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Users className="h-6 w-6 text-muted-foreground" />
                    <CardTitle>Total Users</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : (
                    <p className="text-4xl font-bold">{users?.length ?? 0}</p>
                )}
                 <CardDescription>Total number of registered users.</CardDescription>
            </CardContent>
        </Card>
    );
}
