'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, doc, updateDoc, setDoc, addDoc } from 'firebase/firestore';
import type { License } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle } from 'lucide-react';
import { useProfile } from '@/context/profile-context';


interface LicenseManagementDialogProps {
    user: { id: string; email: string };
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const ALL_GAME_TYPES = ["VIP Slip", "Aviator", "Crash", "Mines & Gems"];

export function LicenseManagementDialog({ user, open, onOpenChange }: LicenseManagementDialogProps) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { userProfile: adminProfile } = useProfile();

    const licensesCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'users', user.id, 'licenses');
    }, [firestore, user.id]);

    const { data: licenses, isLoading } = useCollection<License>(licensesCollection);
    
    const logAdminAction = (action: string, details: object) => {
        if (!firestore || !adminProfile) return;
        const auditLogData = {
            userId: adminProfile.id,
            action,
            details: JSON.stringify(details),
            timestamp: new Date().toISOString(),
            ipAddress: 'not_collected',
        };
        addDoc(collection(firestore, 'auditlogs'), auditLogData).catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: 'auditlogs',
                operation: 'create',
                requestResourceData: auditLogData
            }));
        });
    };

    const handleActivateLicense = async (gameType: string) => {
        if (!firestore) return;
        const licenseId = `${gameType.toLowerCase().replace(/ & /g, '-').replace(/\s/g, '-')}-${user.id}`;
        const licenseRef = doc(firestore, 'users', user.id, 'licenses', licenseId);
        try {
            await setDoc(licenseRef, {
                id: licenseId,
                userId: user.id,
                gameType,
                roundsRemaining: 100,
                paymentVerified: true,
                isActive: true,
            }, { merge: true });
            toast({ title: 'Success', description: `${gameType} license activated for ${user.email}.` });
            logAdminAction('license_activated', { targetUserId: user.id, targetUserEmail: user.email, gameType });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: `Failed to activate license: ${error.message}` });
        }
    };
    
    const handleResetRounds = async (license: License) => {
        if (!firestore) return;
        const licenseRef = doc(firestore, 'users', user.id, 'licenses', license.id);
        try {
            await updateDoc(licenseRef, { roundsRemaining: 100, isActive: true });
            toast({ title: 'Success', description: `Rounds reset to 100 for ${license.gameType} license.` });
            logAdminAction('rounds_reset', { targetUserId: user.id, targetUserEmail: user.email, gameType: license.gameType, rounds: 100 });
        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Error', description: `Failed to reset rounds: ${error.message}` });
        }
    };

    const handleDeactivateLicense = async (license: License) => {
        if (!firestore) return;
        const licenseRef = doc(firestore, 'users', user.id, 'licenses', license.id);
        try {
            await updateDoc(licenseRef, { roundsRemaining: 0, isActive: false });
            toast({ title: 'Success', description: `${license.gameType} license has been deactivated.` });
            logAdminAction('license_deactivated', { targetUserId: user.id, targetUserEmail: user.email, gameType: license.gameType });
        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Error', description: `Failed to deactivate license: ${error.message}` });
        }
    };

    const userLicenses = ALL_GAME_TYPES.map(gameType => {
        const foundLicense = licenses?.find(l => l.gameType === gameType);
        return foundLicense || { id: gameType, gameType, roundsRemaining: 0, paymentVerified: false, isActive: false, userId: user.id };
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Manage Licenses for {user.email}</DialogTitle>
                    <DialogDescription>
                        View, activate, and manage game licenses for this user.
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Game Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Rounds Left</TableHead>
                                <TableHead>Payment</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : userLicenses && userLicenses.length > 0 ? (
                                userLicenses.map(license => (
                                    <TableRow key={license.id}>
                                        <TableCell className="font-medium">{license.gameType}</TableCell>
                                        <TableCell>
                                            {licenses?.some(l => l.id === license.id) ? (
                                                <Badge variant={license.isActive ? 'default' : 'destructive'} className={license.isActive ? 'bg-success' : ''}>
                                                    {license.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            ) : (
                                                 <Badge variant="secondary">Not Created</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>{licenses?.some(l => l.id === license.id) ? license.roundsRemaining : 'N/A'}</TableCell>
                                        <TableCell>
                                             {licenses?.some(l => l.id === license.id) ? (
                                                <Badge variant={license.paymentVerified ? 'default' : 'secondary'} className={license.paymentVerified ? 'bg-success' : ''}>
                                                    {license.paymentVerified ? 'Verified' : 'Pending'}
                                                </Badge>
                                            ) : 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            {licenses?.some(l => l.id === license.id) ? (
                                                <>
                                                    <Button variant="outline" size="sm" onClick={() => handleResetRounds(license as License)}>Reset Rounds</Button>
                                                    <Button variant="destructive" size="sm" onClick={() => handleDeactivateLicense(license as License)} disabled={!license.isActive}>Deactivate</Button>
                                                </>
                                            ) : (
                                                <Button size="sm" onClick={() => handleActivateLicense(license.gameType)}>Activate</Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">
                                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                            <AlertCircle className="h-5 w-5" />
                                            No licenses found for this user.
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    );
}
