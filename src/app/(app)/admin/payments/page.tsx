
'use client';

import { useState } from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, doc, runTransaction, serverTimestamp, query, deleteDoc, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CreditCard, Check, X, Loader2, ArrowLeft } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProfile } from '@/context/profile-context';
import Link from 'next/link';

interface PendingPayment {
    id: string; // This will be the ID of the transaction document
    userId: string;
    userEmail: string;
    licenseId: string;
    userClaimedAmount?: number;
    currency: string;
    userSubmittedTxId: string;
    status: 'pending';
    createdAt: any;
    description: string;
}

export default function PaymentsAdminPage() {
    const firestore = useFirestore();
    const { userProfile } = useProfile();
    const { toast } = useToast();
    const [processingId, setProcessingId] = useState<string | null>(null);
    
    // Query the new top-level 'pending_payments' collection
    const pendingPaymentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'pending_payments'), orderBy('createdAt', 'asc'));
    }, [firestore]);

    const { data: pendingPayments, isLoading, forceRefetch } = useCollection<PendingPayment>(pendingPaymentsQuery);

    const handleVerification = async (payment: PendingPayment, action: 'approve' | 'reject') => {
        if (!firestore || !userProfile) return;

        setProcessingId(payment.id);

        const transactionLogic = async (t: any) => {
            const userTransactionRef = doc(firestore, 'users', payment.userId, 'transactions', payment.id);
            const pendingPaymentRef = doc(firestore, 'pending_payments', payment.id); // Ref to the doc in the queue
            const licenseRef = doc(firestore, 'users', payment.userId, 'user_licenses', payment.licenseId);
            const auditLogRef = doc(collection(firestore, 'auditlogs'));

            if (action === 'approve') {
                t.update(userTransactionRef, {
                    status: 'verified',
                    finalAmount: payment.userClaimedAmount,
                    finalTxId: payment.userSubmittedTxId,
                });
                t.update(licenseRef, {
                    paymentVerified: true,
                    isActive: true,
                });
                t.set(auditLogRef, {
                    action: 'payment_verified',
                    userId: payment.userId,
                    details: `Admin ${userProfile.email} approved payment for transaction ${payment.id}.`,
                    timestamp: serverTimestamp(),
                    ipAddress: 'not_collected',
                });
            } else { // Reject
                 t.update(userTransactionRef, { status: 'failed' });
                 t.set(auditLogRef, {
                    action: 'payment_rejected',
                    userId: payment.userId,
                    details: `Admin ${userProfile.email} rejected payment for transaction ${payment.id}.`,
                    timestamp: serverTimestamp(),
                    ipAddress: 'not_collected',
                });
            }

            // In all cases, delete the document from the pending queue
            t.delete(pendingPaymentRef);
        };

        try {
            await runTransaction(firestore, transactionLogic);
            toast({ title: 'Success', description: `Transaction has been ${action === 'approve' ? 'approved' : 'rejected'}.` });
            if (forceRefetch) forceRefetch();
        } catch (error: any) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: `pending_payments/${payment.id}`,
                operation: 'write',
                requestResourceData: { transactionId: payment.id, action }
            }));
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update transaction.' });
        } finally {
            setProcessingId(null);
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/admin">
                        <ArrowLeft />
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Payment Verification</h1>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <CreditCard className="h-6 w-6 text-muted-foreground" />
                        <CardTitle>Payment Verification Queue</CardTitle>
                    </div>
                    <CardDescription>
                        Review and approve or reject pending user payments.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>User Email</TableHead>
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
                            ) : pendingPayments && pendingPayments.length > 0 ? (
                                pendingPayments.map(tx => {
                                    const isProcessing = processingId === tx.id;
                                    return (
                                        <TableRow key={tx.id}>
                                            <TableCell>{tx.createdAt?.toDate().toLocaleDateString()}</TableCell>
                                            <TableCell>{tx.userEmail}</TableCell>
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
        </div>
    );
}
