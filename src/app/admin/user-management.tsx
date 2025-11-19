'use client';

import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LicenseManagementDialog } from './license-management';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface User {
    id: string;
    email: string;
    role: 'User' | 'Assistant' | 'Admin' | 'SuperAdmin';
    isSuspended: boolean;
    oneXBetId?: string;
}

const ROLES: User['role'][] = ['User', 'Assistant', 'Admin'];

const roleConfig = {
    SuperAdmin: {
        icon: '👑',
        className: 'bg-gold text-black hover:bg-gold/90',
    },
    Admin: {
        icon: '🛡️',
        className: 'bg-purple text-white hover:bg-purple/90',
    },
    Assistant: {
        icon: '🤖',
        className: 'bg-sky-blue text-black hover:bg-sky-blue/90',
    },
    User: {
        icon: '👤',
        className: 'bg-gray text-black hover:bg-gray/90',
    },
};

const RoleBadge = ({ role }: { role: User['role'] }) => {
    const config = roleConfig[role] || roleConfig.User;
    return (
        <Badge className={cn('gap-2', config.className)}>
            <span>{config.icon}</span>
            <span>{role}</span>
        </Badge>
    );
};


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
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const handleSuspendToggle = (user: User) => {
        if (!firestore) return;
        const userRef = doc(firestore, 'users', user.id);
        const updateData = { isSuspended: !user.isSuspended };
        updateDoc(userRef, updateData).catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: userRef.path,
                operation: 'update',
                requestResourceData: updateData
            }));
        });
    };
    
    const handleRoleChange = (userId: string, newRole: User['role']) => {
        if (!firestore) return;
        const userRef = doc(firestore, 'users', userId);
        const updateData = { role: newRole };
        updateDoc(userRef, updateData).catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: userRef.path,
                operation: 'update',
                requestResourceData: updateData
            }));
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
        <>
            <Card>
                <CardHeader>
                    <CardTitle>User & Staff Management</CardTitle>
                    <CardDescription>View, search, and manage all users and staff roles on the platform.</CardDescription>
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
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                        <TableCell className="space-x-2"><Skeleton className="h-8 w-20" /><Skeleton className="h-8 w-12 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                filteredUsers?.map(user => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.email}</TableCell>
                                        <TableCell className="font-code text-xs">{user.id}</TableCell>
                                        <TableCell className="font-code text-xs">{user.oneXBetId || 'N/A'}</TableCell>
                                        <TableCell>
                                            {user.role === 'SuperAdmin' ? (
                                                <RoleBadge role={user.role} />
                                            ) : (
                                                <Select value={user.role} onValueChange={(newRole: User['role']) => handleRoleChange(user.id, newRole)}>
                                                    <SelectTrigger className="w-[140px]">
                                                        <SelectValue asChild>
                                                            <RoleBadge role={user.role} />
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {ROLES.map(role => (
                                                            <SelectItem key={role} value={role}>
                                                                <div className="flex items-center gap-2">
                                                                     <span>{roleConfig[role].icon}</span>
                                                                     <span>{role}</span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.isSuspended ? 'outline' : 'default'} className={user.isSuspended ? 'border-warning text-warning' : 'bg-success'}>
                                                {user.isSuspended ? 'Suspended' : 'Active'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="space-x-2">
                                            <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>Manage</Button>
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
            {selectedUser && (
                <LicenseManagementDialog 
                    user={selectedUser} 
                    open={!!selectedUser} 
                    onOpenChange={(isOpen) => !isOpen && setSelectedUser(null)}
                />
            )}
        </>
    );
}
