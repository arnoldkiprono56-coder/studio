
'use client';

import { useState } from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, doc, runTransaction, serverTimestamp, query, where, collectionGroup } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CreditCard, Check, X, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useProfile } from '@/context/profile-context';

interface Transaction {
    id: string;
    userId: string;
    licenseId: string;
    userClaimedAmount?: number;
    currency: string;
    userSubmittedTxId: string;
    status: 'pending' | 'verified' | 'failed' | 'completed';
    createdAt: any;
    description: string;
}

export default function PaymentsAdminPage() {
    const firestore = useFirestore();
    const { userProfile } = useProfile();
    const { toast } = useToast();
    const [processingId, setProcessingId] = useState<string | null>(null);
    
    // Use a collection group query to find pending transactions across all users.
    const pendingTransactionsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collectionGroup(firestore, 'transactions'), where('status', '==', 'pending'));
    }, [firestore]);

    const { data: pendingTransactions, isLoading, forceRefetch } = useCollection<Transaction>(pendingTransactionsQuery);

    const handleVerification = async (transaction: Transaction, action: 'approve' | 'reject') => {
        if (!firestore || !userProfile) return;

        setProcessingId(transaction.id);

        const transactionLogic = async (t: any) => {
            const transactionRef = doc(firestore, 'users', transaction.userId, 'transactions', transaction.id);
            const licenseRef = doc(firestore, 'users', transaction.userId, 'user_licenses', transaction.licenseId);
            const auditLogRef = doc(collection(firestore, 'auditlogs'));

            if (action === 'approve') {
                t.update(transactionRef, {
                    status: 'verified',
                    finalAmount: transaction.userClaimedAmount,
                    finalTxId: transaction.userSubmittedTxId,
                });
                t.update(licenseRef, {
                    paymentVerified: true,
                    isActive: true,
                });
                t.set(auditLogRef, {
                    action: 'payment_verified',
                    userId: transaction.userId,
                    details: `Admin ${userProfile.email} approved payment for transaction ${transaction.id}.`,
                    timestamp: serverTimestamp(),
                    ipAddress: 'not_collected',
                });
            } else { // Reject
                 t.update(transactionRef, { status: 'failed' });
                 t.set(auditLogRef, {
                    action: 'payment_rejected',
                    userId: transaction.userId,
                    details: `Admin ${userProfile.email} rejected payment for transaction ${transaction.id}.`,
                    timestamp: serverTimestamp(),
                    ipAddress: 'not_collected',
                });
            }
        };

        try {
            await runTransaction(firestore, transactionLogic);
            toast({ title: 'Success', description: `Transaction has been ${action === 'approve' ? 'approved' : 'rejected'}.` });
            if (forceRefetch) forceRefetch();
        } catch (error: any) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: `users/${transaction.userId}/transactions/${transaction.id}`,
                operation: 'write',
                requestResourceData: { transactionId: transaction.id, action }
            }));
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update transaction.' });
        } finally {
            setProcessingId(null);
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <CreditCard className="h-6 w-6 text-muted-foreground" />
                    <CardTitle>Payment Verification</CardTitle>
                </div>
                <CardDescription>
                    Review and approve or reject pending user payments submitted via Transaction ID.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>User Email (ID)</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead>Submitted TX ID</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                                </TableRow>
                            ))
                        ) : pendingTransactions && pendingTransactions.length > 0 ? (
                            pendingTransactions.map(tx => {
                                const isProcessing = processingId === tx.id;
                                return (
                                    <TableRow key={tx.id}>
                                        <TableCell>{tx.createdAt?.toDate().toLocaleDateString()}</TableCell>
                                        <TableCell className="font-mono text-xs">{tx.userId}</TableCell>
                                        <TableCell>{tx.description}</TableCell>
                                        <TableCell className="font-mono">{tx.userSubmittedTxId}</TableCell>
                                        <TableCell>{formatCurrency(tx.userClaimedAmount || 0, tx.currency)}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => handleVerification(tx, 'reject')}
                                                disabled={isProcessing}
                                            >
                                                {isProcessing ? <Loader2 className="animate-spin"/> : <X className="w-4 h-4"/>}
                                                <span className="sr-only">Reject</span>
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                onClick={() => handleVerification(tx, 'approve')}
                                                disabled={isProcessing}
                                                className="bg-success hover:bg-success/90"
                                            >
                                                {isProcessing ? <Loader2 className="animate-spin"/> : <Check className="w-4 h-4"/>}
                                                 <span className="sr-only">Approve</span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                             <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                        <AlertCircle className="h-8 w-8" />
                                        <h3 className="font-semibold text-lg text-foreground">No Pending Payments</h3>
                                        <p className="text-sm">All transactions are up to date.</p>
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
