
'use client';

import { useCollection } from '@/firebase/firestore/use-collection';
import { useProfile } from '@/context/profile-context';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { AlertCircle, Wallet, Download, Tag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMemo } from 'react';
import Link from 'next/link';

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

interface Plan {
    id: string;
    name: string;
    price: number;
    currency: string;
    rounds: number;
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
            collection(firestore, 'users', userProfile.id, 'transactions')
        );
    }, [userProfile?.id, firestore]);
    
    const plansQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'plans'), orderBy('price', 'desc'));
    }, [firestore]);


    const { data: userTransactions, isLoading: isTransactionsLoading } = useCollection<Transaction>(transactionsQuery);
    const { data: plans, isLoading: isPlansLoading } = useCollection<Plan>(plansQuery);


    const sortedTransactions = useMemo(() => {
        if (!userTransactions) return [];
        return [...userTransactions].sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
            return dateB - dateA;
        });
    }, [userTransactions]);


    const isLoading = isProfileLoading || isTransactionsLoading || isPlansLoading;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Wallet</h1>
                <p className="text-muted-foreground">View your balance and transaction history.</p>
            </div>

            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardDescription>Commission Balance</CardDescription>
                    {isProfileLoading ? (
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

             <div>
                <h2 className="text-2xl font-semibold tracking-tight mb-4">Purchase a New License</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                     {isLoading ? (
                         Array.from({ length: 4 }).map((_, i) => (
                             <Card key={i}><CardContent className="pt-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
                         ))
                     ) : plans && plans.length > 0 ? (
                        plans.map(plan => (
                            <Card key={plan.id}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Tag className="w-5 h-5 text-primary"/>{plan.name}</CardTitle>
                                    <CardDescription>{formatCurrency(plan.price, plan.currency)} for {plan.rounds} rounds</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button asChild className="w-full">
                                        <Link href={`/purchase/${plan.id}`}>
                                            Purchase Now <ArrowRight className="w-4 h-4 ml-2" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))
                     ) : (
                        <p className="text-muted-foreground col-span-full">No purchase plans available at the moment.</p>
                     )}
                </div>
            </div>

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
                            {isTransactionsLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : sortedTransactions && sortedTransactions.length > 0 ? (
                                sortedTransactions.map(tx => (
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
                                        <TableCell className={`text-right font-semibold ${tx.amount >= 0 ? 'text-success' : 'text-destructive'}`}>
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
