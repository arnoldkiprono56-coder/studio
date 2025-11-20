'use client';

import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, doc, updateDoc, setDoc, serverTimestamp, query, orderBy, limit, startAfter, getDocs, endBefore, limitToLast } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Users, PlusCircle, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useProfile } from '@/context/profile-context';
import { Button } from '@/components/ui/button';
import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import type { DocumentSnapshot, DocumentData } from 'firebase/firestore';


interface UserProfile {
    id: string;
    email: string;
    role: 'User' | 'Assistant' | 'Admin' | 'SuperAdmin';
    isSuspended: boolean;
}

const gamePlans = [
    { id: 'vip-slip', name: 'VIP Slip', rounds: 100 },
    { id: 'aviator', name: 'Aviator', rounds: 100 },
    { id: 'crash', name: 'Crash', rounds: 100 },
    { id: 'mines-gems', name: 'Mines & Gems', rounds: 100 }
];

function ActivateLicenseDialog({ user, onOpenChange, open }: { user: UserProfile, onOpenChange: (open: boolean) => void, open: boolean }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [selectedGame, setSelectedGame] = useState<string>('');
    const [isActivating, setIsActivating] = useState(false);

    const handleActivate = async () => {
        if (!firestore || !selectedGame) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a game to activate.' });
            return;
        }

        const gamePlan = gamePlans.find(g => g.id === selectedGame);
        if (!gamePlan) {
            toast({ variant: 'destructive', title: 'Error', description: 'Invalid game plan selected.' });
            return;
        }

        setIsActivating(true);

        const licenseId = `${gamePlan.id}-${user.id}`;
        const licenseRef = doc(firestore, 'users', user.id, 'user_licenses', licenseId);

        const licensePayload = {
            id: licenseId,
            userId: user.id,
            gameType: gamePlan.name,
            roundsRemaining: gamePlan.rounds,
            paymentVerified: true,
            isActive: true,
            createdAt: serverTimestamp(),
        };

        setDoc(licenseRef, licensePayload)
            .then(() => {
                toast({ title: 'Success!', description: `${gamePlan.name} license activated for ${user.email}.` });
                onOpenChange(false);
                setSelectedGame('');
            })
            .catch((error) => {
                 errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: licenseRef.path,
                    operation: 'write',
                    requestResourceData: licensePayload
                }));
            })
            .finally(() => {
                setIsActivating(false);
            });
    };


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Activate License for {user.email}</DialogTitle>
                    <DialogDescription>
                        Select a game to create a new, active license for this user. This will grant them 100 rounds.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                     <Select value={selectedGame} onValueChange={setSelectedGame}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a game..." />
                        </SelectTrigger>
                        <SelectContent>
                            {gamePlans.map(game => (
                                <SelectItem key={game.id} value={game.id}>{game.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" disabled={isActivating}>Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleActivate} disabled={isActivating || !selectedGame}>
                        {isActivating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isActivating ? 'Activating...' : 'Activate'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const PAGE_SIZE = 10;

export function UserManagement() {
    const firestore = useFirestore();
    const { userProfile: adminProfile } = useProfile();
    const { toast } = useToast();
    const [dialogState, setDialogState] = useState<{ open: boolean, user: UserProfile | null }>({ open: false, user: null });
    const [lastVisible, setLastVisible] = useState<DocumentSnapshot<DocumentData> | null>(null);
    const [firstVisible, setFirstVisible] = useState<DocumentSnapshot<DocumentData> | null>(null);
    const [page, setPage] = useState(1);
    const [paginationHistory, setPaginationHistory] = useState<(DocumentSnapshot<DocumentData> | null)[]>([null]);


    const usersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        let q = query(collection(firestore, 'users'), orderBy('email'), limit(PAGE_SIZE));
        const cursor = paginationHistory[page - 1];
        if (cursor) {
            q = query(q, startAfter(cursor));
        }
        return q;
    }, [firestore, page, paginationHistory]);

    const { data: users, isLoading, error } = useCollection<UserProfile>(usersQuery);
    
     useEffect(() => {
        if (!isLoading && users && users.length > 0) {
            const newFirst = (usersQuery as any)?.__private_internal_snapshot?.docs[0];
            const newLast = (usersQuery as any)?.__private_internal_snapshot?.docs[users.length - 1];
            setFirstVisible(newFirst || null);
            setLastVisible(newLast || null);
        }
    }, [users, isLoading, usersQuery]);


    const goToNextPage = () => {
        if (lastVisible) {
            setPaginationHistory(prev => [...prev, lastVisible]);
            setPage(prev => prev + 1);
        }
    };

    const goToPreviousPage = () => {
        if (page > 1) {
            setPaginationHistory(prev => prev.slice(0, -1));
            setPage(prev => prev - 1);
        }
    };
    
    if (error) {
        console.error("Firestore error in UserManagement:", error);
    }

    const handleRoleChange = (userId: string, newRole: UserProfile['role']) => {
        if (!firestore || !adminProfile) return;
        if (adminProfile.role !== 'SuperAdmin' && (newRole === 'SuperAdmin' || newRole === 'Admin')) {
            toast({ variant: 'destructive', title: 'Permission Denied', description: 'Only SuperAdmins can promote to Admin or SuperAdmin.' });
            return;
        }

        const userRef = doc(firestore, 'users', userId);
        const updateData = { role: newRole };
        
        updateDoc(userRef, updateData)
            .then(() => {
                toast({ title: 'Success', description: `User role updated to ${newRole}. This will take effect on their next login.` });
            })
            .catch((e: any) => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: userRef.path,
                    operation: 'update',
                    requestResourceData: updateData
                }));
            });
    };

    const handleBanChange = (userId: string, isBanned: boolean) => {
        if (!firestore) return;
        
        const userRef = doc(firestore, 'users', userId);
        const updateData = { isSuspended: isBanned };
        
        updateDoc(userRef, updateData)
            .then(() => {
                toast({ title: 'Success', description: `User has been ${isBanned ? 'banned' : 'un-banned'}.` });
            })
            .catch((e: any) => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: userRef.path,
                    operation: 'update',
                    requestResourceData: updateData
                }));
            });
    };

    const openDialogForUser = (user: UserProfile) => {
        setDialogState({ open: true, user });
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
                            <TableHead>Ban/Un-ban</TableHead>
                             <TableHead className="text-right">Activate License</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-28" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-32" /></TableCell>
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
                                            disabled={user.id === adminProfile?.id || adminProfile?.role !== 'SuperAdmin'}
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
                                            {user.isSuspended ? 'Banned' : 'Active'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-start gap-2">
                                            <Switch
                                                checked={user.isSuspended}
                                                onCheckedChange={(checked) => handleBanChange(user.id, checked)}
                                                disabled={user.id === adminProfile?.id}
                                            />
                                        </div>
                                    </TableCell>
                                     <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => openDialogForUser(user)}>
                                            <PlusCircle className="mr-2 h-4 w-4"/>
                                            Activate License
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">
                                     <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                        {error ? <AlertCircle className="h-5 w-5 text-destructive" /> : <AlertCircle className="h-5 w-5" />}
                                        {error ? "Permission Denied: Could not load users." : "No users found."}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                {dialogState.open && dialogState.user && (
                    <ActivateLicenseDialog 
                        user={dialogState.user}
                        open={dialogState.open}
                        onOpenChange={(open) => setDialogState({ open, user: open ? dialogState.user : null })}
                    />
                )}
                 <div className="flex items-center justify-end space-x-2 py-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPreviousPage}
                        disabled={page <= 1}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNextPage}
                        disabled={!users || users.length < PAGE_SIZE}
                    >
                        Next
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
