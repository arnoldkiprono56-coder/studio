'use client';

import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useProfile } from '@/context/profile-context';

interface UserProfile {
    id: string;
    email: string;
    role: 'User' | 'Assistant' | 'Admin' | 'SuperAdmin';
    isSuspended: boolean;
}

export function UserManagement() {
    const firestore = useFirestore();
    const { userProfile: adminProfile } = useProfile();
    const { toast } = useToast();

    const usersCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'users');
    }, [firestore]);

    const { data: users, isLoading, error } = useCollection<UserProfile>(usersCollection);
    
    if (error) {
        console.error("Firestore error in UserManagement:", error);
    }

    const handleRoleChange = async (userId: string, newRole: UserProfile['role']) => {
        if (!firestore || !adminProfile) return;
        if (adminProfile.role !== 'SuperAdmin' && (newRole === 'SuperAdmin' || newRole === 'Admin')) {
            toast({ variant: 'destructive', title: 'Permission Denied', description: 'Only SuperAdmins can promote to Admin or SuperAdmin.' });
            return;
        }

        const userRef = doc(firestore, 'users', userId);
        const adminRef = doc(firestore, 'admins', userId);
        const batch = writeBatch(firestore);

        batch.update(userRef, { role: newRole });

        if (newRole === 'Admin' || newRole === 'SuperAdmin') {
            // Ensure the user is in the /admins collection
            batch.set(adminRef, { userId: userId, isAdmin: true });
        } else {
            // If demoted from an admin role, remove from /admins
            batch.delete(adminRef);
        }

        try {
            await batch.commit();
            toast({ title: 'Success', description: `User role updated to ${newRole}.` });
        } catch (e: any) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: `/users/${userId} and /admins/${userId}`,
                operation: 'write',
                requestResourceData: { role: newRole }
            }));
        }
    };

    const handleSuspensionChange = async (userId: string, isSuspended: boolean) => {
        if (!firestore) return;
        
        const userRef = doc(firestore, 'users', userId);
        try {
            const batch = writeBatch(firestore);
            batch.update(userRef, { isSuspended });
            await batch.commit();
            toast({ title: 'Success', description: `User has been ${isSuspended ? 'suspended' : 'unsuspended'}.` });
        } catch (e: any) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: userRef.path,
                operation: 'update',
                requestResourceData: { isSuspended }
            }));
        }
    };


    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Users className="h-6 w-6 text-muted-foreground" />
                    <CardTitle>User Management</CardTitle>
                </div>
                <CardDescription>Promote, ban, and manage all users on the platform.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-28" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-20" /></TableCell>
                                </TableRow>
                            ))
                        ) : users && users.length > 0 ? (
                            users.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.email}</TableCell>
                                    <TableCell>
                                        <Select
                                            defaultValue={user.role}
                                            onValueChange={(value: UserProfile['role']) => handleRoleChange(user.id, value)}
                                            disabled={user.id === adminProfile?.id}
                                        >
                                            <SelectTrigger className="w-[120px]">
                                                <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="User">User</SelectItem>
                                                <SelectItem value="Assistant">Assistant</SelectItem>
                                                <SelectItem value="Admin">Admin</SelectItem>
                                                <SelectItem value="SuperAdmin">SuperAdmin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.isSuspended ? 'destructive' : 'default'} className={!user.isSuspended ? 'bg-success' : ''}>
                                            {user.isSuspended ? 'Suspended' : 'Active'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <span>{user.isSuspended ? 'Unsuspend' : 'Suspend'}</span>
                                            <Switch
                                                checked={user.isSuspended}
                                                onCheckedChange={(checked) => handleSuspensionChange(user.id, checked)}
                                                disabled={user.id === adminProfile?.id}
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">
                                     <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                        {error ? <AlertCircle className="h-5 w-5 text-destructive" /> : <AlertCircle className="h-5 w-5" />}
                                        {error ? "Permission Denied: Could not load users." : "No users found."}
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
