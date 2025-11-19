'use client';

import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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

    // IMPORTANT: In a real app, this should call a Firebase Function
    // to set a custom claim on the user. The client should not be able
    // to change its own role or other users' roles directly in Firestore
    // without server-side validation.
    const handleRoleChange = async (userId: string, newRole: UserProfile['role']) => {
        if (!firestore || !adminProfile) return;
        if (adminProfile.role !== 'SuperAdmin' && (newRole === 'SuperAdmin' || newRole === 'Admin')) {
            toast({ variant: 'destructive', title: 'Permission Denied', description: 'Only SuperAdmins can promote to Admin or SuperAdmin.' });
            return;
        }

        const userRef = doc(firestore, 'users', userId);
        const updateData = { role: newRole };
        
        try {
            await updateDoc(userRef, updateData);
            toast({ title: 'Success', description: `User role updated to ${newRole}. This will take effect on their next login.` });
            // In a full implementation, you would trigger a Firebase Function here.
        } catch (e: any) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: userRef.path,
                operation: 'update',
                requestResourceData: updateData
            }));
        }
    };

    const handleSuspensionChange = async (userId: string, isSuspended: boolean) => {
        if (!firestore) return;
        
        const userRef = doc(firestore, 'users', userId);
        const updateData = { isSuspended };
        try {
            await updateDoc(userRef, updateData);
            toast({ title: 'Success', description: `User has been ${isSuspended ? 'suspended' : 'unsuspended'}.` });
        } catch (e: any) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: userRef.path,
                operation: 'update',
                requestResourceData: updateData
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
