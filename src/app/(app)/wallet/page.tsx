
'use client';

import { useCollection } from '@/firebase/firestore/use-collection';
import { useProfile } from '@/context/profile-context';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { AlertCircle, Wallet, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Transaction {
    id: string;
    userId: string;
    type: 'purchase' | 'commission' | 'withdrawal' | 'reward';
    description: string;
    amount: number;
    currency: string;
    status: 'pending' | 'verified' | 'failed' | 'completed';
    createdAt: any; 
}

const statusVariant: Record<Transaction['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'outline',
    verified: 'default',
    completed: 'default',
    failed: 'destructive',
};

export default function WalletPage() {
    const { userProfile, isProfileLoading } = useProfile();
    const firestore = useFirestore();

    const transactionsQuery = useMemoFirebase(() => {
        if (!userProfile?.id || !firestore) return null;
        return query(
            collection(firestore, 'transactions'),
            where('userId', '==', userProfile.id),
            orderBy('createdAt', 'desc')
        );
    }, [userProfile?.id, firestore]);

    const { data: userTransactions, isLoading: isTransactionsLoading } = useCollection<Transaction>(transactionsQuery);

    const isLoading = isProfileLoading || isTransactionsLoading;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Wallet</h1>
                <p className="text-muted-foreground">View your balance and transaction history.</p>
            </div>

            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardDescription>Commission Balance</CardDescription>
                    {isLoading ? (
                        <Skeleton className="h-10 w-48" />
                    ) : (
                        <CardTitle className="text-4xl">{formatCurrency(userProfile?.balance || 0)}</CardTitle>
                    )}
                </CardHeader>
                <CardContent>
                    <Button className="w-full" disabled>
                        <Download className="mr-2 h-4 w-4" />
                        Withdraw Funds (Coming Soon)
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>A record of all your financial activities on the platform.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : userTransactions && userTransactions.length > 0 ? (
                                userTransactions.map(tx => (
                                    <TableRow key={tx.id}>
                                        <TableCell>
                                            {tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleDateString() : 'N/A'}
                                        </TableCell>
                                        <TableCell className="font-medium">{tx.description}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="capitalize">{tx.type}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={statusVariant[tx.status]} className="capitalize">{tx.status}</Badge>
                                        </TableCell>
                                        <TableCell className={`text-right font-semibold ${tx.amount > 0 ? 'text-success' : 'text-destructive'}`}>
                                            {formatCurrency(tx.amount, tx.currency)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
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
        </div>
    );
}
