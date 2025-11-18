'use client';

import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface User {
    id: string;
    email: string;
    role: string;
    isSuspended: boolean;
}

export function UserManagementTable() {
    const firestore = useFirestore();
    const usersCollection = collection(firestore, 'users');
    const { data: users, isLoading } = useCollection<User>(usersCollection);

    const handleSuspendToggle = async (user: User) => {
        if (!firestore) return;
        const userRef = doc(firestore, 'users', user.id);
        await updateDoc(userRef, {
            isSuspended: !user.isSuspended
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action (Suspend)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : (
                            users?.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === 'SuperAdmin' ? 'destructive' : 'secondary'}>{user.role}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.isSuspended ? 'outline' : 'default'} className={user.isSuspended ? 'border-warning text-warning' : 'bg-success'}>
                                            {user.isSuspended ? 'Suspended' : 'Active'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Switch
                                            checked={user.isSuspended}
                                            onCheckedChange={() => handleSuspendToggle(user)}
                                            aria-label={`Suspend ${user.email}`}
                                            disabled={user.role === 'SuperAdmin'}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
