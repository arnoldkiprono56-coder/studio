"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpRight, ArrowDownLeft, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useFirestore, useMemoFirebase } from "@/firebase";
import { useProfile } from "@/context/profile-context";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Skeleton } from "@/components/ui/skeleton";

interface Transaction {
    id: string;
    type: "commission" | "withdrawal" | "reward" | "purchase";
    description: string;
    amount: number;
    createdAt: { seconds: number, nanoseconds: number };
    currency?: string;
}

export default function WalletPage() {
    const { userProfile, isProfileLoading } = useProfile();
    const firestore = useFirestore();

    const transactionsQuery = useMemoFirebase(() => {
        if (!firestore || !userProfile?.id) return null;
        return query(
            collection(firestore, 'transactions'),
            where('userId', '==', userProfile.id),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, userProfile?.id]);

    const { data: transactions, isLoading: isTransactionsLoading } = useCollection<Transaction>(transactionsQuery);
    
    const isLoading = isProfileLoading || isTransactionsLoading;

    if (isLoading) {
        return (
             <div className="space-y-8">
                <Skeleton className="h-9 w-24 mb-2" />
                <Skeleton className="h-5 w-64 mb-4" />
                <Card><CardContent className="pt-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
                <Skeleton className="h-8 w-48 mb-4" />
                <Card><CardContent className="pt-6 space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></CardContent></Card>
            </div>
        )
    }

    const balance = userProfile?.balance || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Wallet</h1>
        <p className="text-muted-foreground">Manage your funds and view transaction history.</p>
      </div>

      <Card className="bg-gradient-to-br from-primary/80 to-primary">
        <CardHeader>
            <CardTitle className="text-primary-foreground">Current Balance</CardTitle>
            <CardDescription className="text-primary-foreground/80">Available for withdrawal</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-end justify-between">
                <p className="text-5xl font-bold text-primary-foreground">{formatCurrency(balance)}</p>
                <Button variant="secondary" disabled>Request Withdrawal</Button>
            </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-4">Transaction History</h2>
        <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="hidden md:table-cell">Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions && transactions.length > 0 ? (
                        transactions.map((tx) => (
                            <TableRow key={tx.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${tx.amount > 0 ? 'bg-success/20' : 'bg-error/20'}`}>
                                        {tx.amount > 0 ? <ArrowUpRight className="w-4 h-4 text-success" /> : <ArrowDownLeft className="w-4 h-4 text-error" />}
                                        </div>
                                        <div>
                                            <p className="font-medium">{tx.description}</p>
                                            <Badge variant="outline" className="md:hidden">{new Date(tx.createdAt.seconds * 1000).toLocaleDateString()}</Badge>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className={`text-right font-semibold ${tx.amount > 0 ? 'text-success' : 'text-error'}`}>
                                    {formatCurrency(tx.amount, tx.currency)}
                                </TableCell>
                                <TableCell className="hidden md:table-cell">{new Date(tx.createdAt.seconds * 1000).toLocaleDateString()}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                         <TableRow>
                            <TableCell colSpan={3} className="text-center h-24">
                                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                    <AlertCircle className="h-5 w-5" />
                                    No transactions found.
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </Card>
      </div>
    </div>
  );
}
