'use client';

import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

interface User {
    id: string;
    email: string;
    role: string;
    isSuspended: boolean;
    oneXBetId?: string;
}

export function UserManagementTable() {
    const firestore = useFirestore();
    const usersCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'users');
    }, [firestore]);

    const { data: users, isLoading } = useCollection<User>(usersCollection);

    const [emailFilter, setEmailFilter] = useState('');
    const [userIdFilter, setUserIdFilter] = useState('');
    const [oneXBetIdFilter, setOneXBetIdFilter] = useState('');

    const handleSuspendToggle = async (user: User) => {
        if (!firestore) return;
        const userRef = doc(firestore, 'users', user.id);
        await updateDoc(userRef, {
            isSuspended: !user.isSuspended
        });
    };

    const filteredUsers = users?.filter(user => {
        return (
            (emailFilter ? user.email.toLowerCase().includes(emailFilter.toLowerCase()) : true) &&
            (userIdFilter ? user.id.toLowerCase().includes(userIdFilter.toLowerCase()) : true) &&
            (oneXBetIdFilter ? user.oneXBetId?.toLowerCase().includes(oneXBetIdFilter.toLowerCase()) : true)
        );
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View, search, and manage all users on the platform.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 border rounded-lg">
                    <Input
                        placeholder="Filter by email..."
                        value={emailFilter}
                        onChange={e => setEmailFilter(e.target.value)}
                    />
                    <Input
                        placeholder="Filter by User ID..."
                        value={userIdFilter}
                        onChange={e => setUserIdFilter(e.target.value)}
                    />
                    <Input
                        placeholder="Filter by 1xBet ID..."
                        value={oneXBetIdFilter}
                        onChange={e => setOneXBetIdFilter(e.target.value)}
                    />
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>User ID</TableHead>
                            <TableHead>1xBet ID</TableHead>
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
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : (
                            filteredUsers?.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.email}</TableCell>
                                    <TableCell className="font-code text-xs">{user.id}</TableCell>
                                    <TableCell className="font-code text-xs">{user.oneXBetId || 'N/A'}</TableCell>
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