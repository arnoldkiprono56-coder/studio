'use client';

import { useState } from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, doc, writeBatch, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { AlertCircle, CreditCard, Loader2 } from 'lucide-react';

interface PaymentTransaction {
    id: string;
    userId: string;
    licenseId: string;
    amount: number;
    currency: string;
    status: 'pending' | 'verified' | 'failed';
    paymentMethod: string;
    webhookVerified?: boolean;
    createdAt: { seconds: number, nanoseconds: number };
}

export function TransactionManagement() {
    const firestore = useFirestore();
    const transactionsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'transactions'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: transactions, isLoading } = useCollection<PaymentTransaction>(transactionsCollection);
    const { toast } = useToast();

    const [transactionId, setTransactionId] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const handleVerifyTransaction = async () => {
        if (!transactionId.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a Transaction ID.' });
            return;
        }
        if (!firestore) return;

        setIsVerifying(true);
        try {
            // Firestore does not natively use the document ID from the client in a query.
            // A common pattern is to store the ID as a field if you need to query by it.
            // Assuming `id` field is stored in the document.
            const transactionRef = doc(firestore, 'transactions', transactionId.trim());
            const transactionSnap = await getDocs(query(collection(firestore, 'transactions'), where('id', '==', transactionId.trim())));
            
            if (transactionSnap.empty) {
                toast({ variant: 'destructive', title: 'Not Found', description: `Transaction with ID "${transactionId}" not found.` });
                setIsVerifying(false);
                return;
            }

            const transactionDoc = transactionSnap.docs[0];
            const transactionData = transactionDoc.data() as PaymentTransaction;

            if (transactionData.status === 'verified') {
                 toast({ variant: 'default', title: 'Already Verified', description: `Transaction ${transactionId} is already verified.` });
                 setIsVerifying(false);
                 return;
            }

            const batch = writeBatch(firestore);

            // 1. Update the transaction
            batch.update(transactionDoc.ref, { status: 'verified', webhookVerified: true });

            // 2. Update the corresponding license
            if (transactionData.userId && transactionData.licenseId) {
                const licenseRef = doc(firestore, 'users', transactionData.userId, 'user_licenses', transactionData.licenseId);
                batch.update(licenseRef, { paymentVerified: true, isActive: true });
            } else {
                 throw new Error('Transaction is missing required user or license ID.');
            }

            await batch.commit();

            toast({ title: 'Success', description: `Transaction ${transactionId} has been manually verified.` });
            setTransactionId('');
        } catch (error: any) {
            console.error('Verification failed:', error);
            const isPermissionError = error.code === 'permission-denied';
            
            if(isPermissionError) {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: `transactions/${transactionId.trim()}`,
                    operation: 'update',
                }));
            }
            
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to verify transaction.' });
        } finally {
            setIsVerifying(false);
        }
    };
    
    const sortedTransactions = transactions; // Already sorted by query

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <CreditCard className="h-6 w-6 text-muted-foreground" />
                    <CardTitle>Transaction Management</CardTitle>
                </div>
                <CardDescription>View recent transactions and manually verify payments if a webhook fails.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-4 border rounded-lg space-y-3 bg-muted/20">
                    <h3 className="font-semibold">Manual Payment Verification</h3>
                     <div className="flex items-center gap-2">
                        <Input
                            placeholder="Enter Transaction ID to verify..."
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            className="max-w-xs"
                        />
                        <Button onClick={handleVerifyTransaction} disabled={isVerifying || !transactionId}>
                            {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isVerifying ? 'Verifying...' : 'Verify Transaction'}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Use this to manually approve a payment if the automated webhook confirmation fails. This will activate the user's license.
                    </p>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User ID / License ID</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                </TableRow>
                            ))
                        ) : sortedTransactions && sortedTransactions.length > 0 ? (
                            sortedTransactions.map(tx => (
                                <TableRow key={tx.id}>
                                    <TableCell>
                                        <div className="font-medium font-code text-xs">{tx.userId}</div>
                                        <div className="text-muted-foreground text-xs font-code">{tx.licenseId}</div>
                                    </TableCell>
                                    <TableCell className="font-semibold">{formatCurrency(tx.amount, tx.currency)}</TableCell>
                                    <TableCell><Badge variant="outline">{tx.paymentMethod}</Badge></TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            tx.status === 'verified' ? 'default' :
                                            tx.status === 'pending' ? 'secondary' : 'destructive'
                                        } className={
                                             tx.status === 'verified' ? 'bg-success' : 
                                             tx.status === 'pending' ? 'border-warning text-warning' : ''
                                        }>
                                            {tx.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {tx.createdAt ? new Date(tx.createdAt.seconds * 1000).toLocaleString() : 'N/A'}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">
                                     <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                        <AlertCircle className="h-5 w-5" />
                                        No transactions found.
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
