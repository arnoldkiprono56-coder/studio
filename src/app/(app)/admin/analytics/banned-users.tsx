
'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, UserX } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface UserProfile {
  id: string;
  email: string;
  role: 'User' | 'Assistant' | 'Admin' | 'SuperAdmin';
}

export function BannedUsers() {
    const firestore = useFirestore();

    const bannedUsersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'users'),
            where('isSuspended', '==', true),
            orderBy('email')
        );
    }, [firestore]);

    const { data: bannedUsers, isLoading } = useCollection<UserProfile>(bannedUsersQuery);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <UserX className="h-6 w-6 text-muted-foreground" />
                    <CardTitle>Suspended Users</CardTitle>
                </div>
                <CardDescription>A list of all currently suspended user accounts.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>User ID</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-64" /></TableCell>
                                    </TableRow>
                                ))
                            ) : bannedUsers && bannedUsers.length > 0 ? (
                                bannedUsers.map(user => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.email}</TableCell>
                                        <TableCell>{user.role}</TableCell>
                                        <TableCell className="font-mono text-xs">{user.id}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                            <AlertCircle className="h-5 w-5" />
                                            No suspended users found.
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
