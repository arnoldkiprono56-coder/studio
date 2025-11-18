'use client';

import { useState } from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

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
        return collection(firestore, 'transactions');
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
            const q = query(collection(firestore, 'transactions'), where('id', '==', transactionId.trim()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast({ variant: 'destructive', title: 'Not Found', description: `Transaction with ID "${transactionId}" not found.` });
                setIsVerifying(false);
                return;
            }

            const transactionDoc = querySnapshot.docs[0];
            const transactionData = transactionDoc.data() as PaymentTransaction;

            const batch = writeBatch(firestore);

            // 1. Update the transaction
            const transactionRef = doc(firestore, 'transactions', transactionDoc.id);
            batch.update(transactionRef, { status: 'verified', webhookVerified: true });

            // 2. Update the corresponding license
            const licenseRef = doc(firestore, 'users', transactionData.userId, 'licenses', transactionData.licenseId);
            batch.update(licenseRef, { paymentVerified: true, isActive: true });

            await batch.commit();

            toast({ title: 'Success', description: `Transaction ${transactionId} has been manually verified.` });
            setTransactionId('');
        } catch (error: any) {
            console.error('Verification failed:', error);
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to verify transaction.' });
        } finally {
            setIsVerifying(false);
        }
    };
    
    const sortedTransactions = transactions?.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    return (
        <Card>
            <CardHeader>
                <CardTitle>Transaction Management</CardTitle>
                <CardDescription>View recent transactions and manually verify payments if the webhook fails.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-4 border rounded-lg space-y-4">
                    <h3 className="font-semibold">Manual Payment Verification</h3>
                     <div className="flex items-center gap-2">
                        <Input
                            placeholder="Enter Transaction ID to verify..."
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            className="max-w-xs"
                        />
                        <Button onClick={handleVerifyTransaction} disabled={isVerifying}>
                            {isVerifying ? 'Verifying...' : 'Verify Transaction'}
                        </Button>
                    </div>
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
                        ) : (
                            sortedTransactions?.map(tx => (
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
                                             tx.status === 'pending' ? 'bg-warning' : ''
                                        }>
                                            {tx.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {tx.createdAt ? new Date(tx.createdAt.seconds * 1000).toLocaleString() : 'N/A'}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                         {!isLoading && (!transactions || transactions.length === 0) && (
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
