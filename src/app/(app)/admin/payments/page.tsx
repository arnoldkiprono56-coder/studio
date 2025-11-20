'use client';

import { useState } from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, doc, runTransaction, serverTimestamp, query, where } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CreditCard, Check, X, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Transaction {
    id: string;
    userId: string;
    licenseId: string;
    userClaimedAmount?: number;
    finalAmount?: number;
    currency: string;
    userSubmittedTxId: string;
    finalTxId?: string;
    status: 'pending' | 'verified' | 'failed' | 'completed';
    rawMessage: string;
    createdAt: any;
    description: string;
}

function VerificationCard({ transaction, onUpdate }: { transaction: Transaction, onUpdate: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [finalTxId, setFinalTxId] = useState(transaction.userSubmittedTxId || '');
    const [finalAmount, setFinalAmount] = useState(transaction.userClaimedAmount?.toString() || '');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleVerification = async (action: 'approve' | 'reject') => {
        if (!firestore) return;

        const parsedAmount = parseFloat(finalAmount);
        if (action === 'approve' && (isNaN(parsedAmount) || !finalTxId)) {
            toast({ variant: 'destructive', title: 'Invalid Input', description: 'Please provide a valid final amount and transaction ID.' });
            return;
        }
        
        setIsProcessing(true);

        const transactionLogic = async (t: any) => {
            const transactionRef = doc(firestore, 'transactions', transaction.id);
            const licenseRef = doc(firestore, 'users', transaction.userId, 'user_licenses', transaction.licenseId);
            const auditLogRef = doc(collection(firestore, 'auditlogs'));

            if (action === 'approve') {
                // Update transaction
                t.update(transactionRef, {
                    status: 'verified',
                    finalAmount: parsedAmount,
                    finalTxId: finalTxId,
                });

                // Activate license
                t.update(licenseRef, {
                    paymentVerified: true,
                    isActive: true,
                });
                 // Create audit log
                t.set(auditLogRef, {
                    action: 'payment_verified',
                    userId: transaction.userId,
                    details: `Admin approved payment for transaction ${transaction.id}.`,
                    timestamp: serverTimestamp(),
                    ipAddress: 'not_collected', // On server, this would be admin's IP
                });
            } else { // Reject
                 t.update(transactionRef, { status: 'failed' });
                 t.set(auditLogRef, {
                    action: 'payment_rejected',
                    userId: transaction.userId,
                    details: `Admin rejected payment for transaction ${transaction.id}.`,
                    timestamp: serverTimestamp(),
                    ipAddress: 'not_collected',
                });
            }
        };

        runTransaction(firestore, transactionLogic)
            .then(() => {
                toast({ title: 'Success', description: `Transaction has been ${action === 'approve' ? 'approved' : 'rejected'}.` });
                if (onUpdate) onUpdate(); // Trigger refetch
            })
            .catch((error: any) => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: `transactions/${transaction.id} and subcollection documents`,
                    operation: 'write',
                    requestResourceData: { transactionId: transaction.id, action }
                }));
            })
            .finally(() => {
                setIsProcessing(false);
            });
    };


    return (
        <div className="space-y-4 rounded-lg border p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                    <p className="font-semibold">User Claimed Amount</p>
                    <p>{formatCurrency(transaction.userClaimedAmount || 0)}</p>
                </div>
                <div>
                    <p className="font-semibold">User Submitted TXN ID</p>
                    <p className="font-mono">{transaction.userSubmittedTxId}</p>
                </div>
                 <div>
                    <p className="font-semibold">User Email</p>
                    <p>{transaction.userId}</p>
                </div>
            </div>
            <p className="text-xs bg-muted p-2 rounded-md font-mono whitespace-pre-wrap">{transaction.rawMessage}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                 <div className="space-y-1">
                    <Label htmlFor={`amount-${transaction.id}`}>Final Amount (KES)</Label>
                    <Input id={`amount-${transaction.id}`} value={finalAmount} onChange={e => setFinalAmount(e.target.value)} placeholder="e.g., 1500" />
                 </div>
                 <div className="space-y-1">
                    <Label htmlFor={`txid-${transaction.id}`}>Final TXN ID</Label>
                    <Input id={`txid-${transaction.id}`} value={finalTxId} onChange={e => setFinalTxId(e.target.value)} placeholder="e.g., SAI..." />
                 </div>
            </div>
             <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => handleVerification('reject')} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="animate-spin" /> : <X className="w-4 h-4 mr-2" />}
                    Reject
                </Button>
                <Button size="sm" onClick={() => handleVerification('approve')} disabled={isProcessing}>
                     {isProcessing ? <Loader2 className="animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                    Approve
                </Button>
            </div>
        </div>
    )
}


export default function PaymentsAdminPage() {
    const firestore = useFirestore();
    
    const pendingTransactionsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'transactions'), where('status', '==', 'pending'));
    }, [firestore]);

    const { data: pendingTransactions, isLoading, forceRefetch } = useCollection<Transaction>(pendingTransactionsQuery);
    
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <CreditCard className="h-6 w-6 text-muted-foreground" />
                    <CardTitle>Payment Verification</CardTitle>
                </div>
                <CardDescription>
                    Review and approve or reject pending user payments.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                ) : pendingTransactions && pendingTransactions.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {pendingTransactions.map(tx => (
                            <AccordionItem value={tx.id} key={tx.id} className="border-b-0">
                                <AccordionTrigger className="border rounded-md px-4 hover:no-underline bg-background data-[state=open]:rounded-b-none">
                                    <div className="flex justify-between items-center w-full">
                                        <div className="text-left">
                                            <p className="font-semibold">{tx.description}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleString() : ''}
                                            </p>
                                        </div>
                                        <Badge variant="outline">Pending</Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="border border-t-0 rounded-b-md p-0">
                                    <VerificationCard transaction={tx} onUpdate={forceRefetch!} />
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <div className="text-center h-48 flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/30 rounded-lg">
                        <AlertCircle className="h-8 w-8" />
                        <h3 className="font-semibold text-lg text-foreground">No Pending Payments</h3>
                        <p className="text-sm">All transactions are up to date.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
