
'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { doc, setDoc, serverTimestamp, getDocs, collection, query, where, writeBatch, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, Banknote, ListChecks } from 'lucide-react';
import { useProfile } from '@/context/profile-context';
import { useCollection } from '@/firebase/firestore/use-collection';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';


interface PreVerifiedPayment {
    id: string;
    transactionId: string;
    amount: number;
    currency: string;
    status: 'available' | 'claimed';
    adminId: string;
    createdAt: any;
    claimedBy?: string;
    claimedAt?: any;
}


function PreVerifiedPaymentsList() {
    const firestore = useFirestore();
    const paymentsQuery = query(collection(firestore, 'preVerifiedPayments'), where('status', '==', 'available'), orderBy('createdAt', 'desc'));
    const { data: availablePayments, isLoading } = useCollection<PreVerifiedPayment>(paymentsQuery);
    
    return (
         <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <ListChecks className="h-6 w-6 text-muted-foreground" />
                    <CardTitle>Available Credits</CardTitle>
                </div>
                <CardDescription>
                    A list of pre-verified transaction IDs that are available for users to claim.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Transaction ID</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Date Added</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={3} className="h-24 text-center">Loading...</TableCell></TableRow>
                        ) : availablePayments && availablePayments.length > 0 ? (
                            availablePayments.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-mono">{p.transactionId}</TableCell>
                                    <TableCell>{formatCurrency(p.amount, p.currency)}</TableCell>
                                    <TableCell>{p.createdAt?.toDate().toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                             <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">No available credits found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}


export default function PreVerifiedPaymentsPage() {
    const firestore = useFirestore();
    const { userProfile } = useProfile();
    const { toast } = useToast();
    const [transactionId, setTransactionId] = useState('');
    const [amount, setAmount] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveCredit = async () => {
        if (!firestore || !userProfile) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in as an admin.' });
            return;
        }

        const parsedAmount = parseFloat(amount);
        if (!transactionId.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
            toast({ variant: 'destructive', title: 'Invalid Input', description: 'Please enter a valid transaction ID and a positive amount.' });
            return;
        }
        
        setIsSaving(true);
        
        const creditRef = doc(firestore, 'preVerifiedPayments', transactionId.trim().toUpperCase());
        const newCredit: Omit<PreVerifiedPayment, 'id'> = {
            transactionId: transactionId.trim().toUpperCase(),
            amount: parsedAmount,
            currency: 'KES',
            status: 'available',
            adminId: userProfile.id,
            createdAt: serverTimestamp(),
        };

        try {
            await setDoc(creditRef, newCredit);
            toast({
                title: 'Credit Saved!',
                description: `Transaction ID ${newCredit.transactionId} can now be claimed by a user.`,
            });
            setTransactionId('');
            setAmount('');
        } catch (error: any) {
            console.error("Error saving pre-verified payment:", error);
            toast({ variant: 'destructive', title: 'Save Failed', description: error.message || 'Could not save the credit.' });
        } finally {
            setIsSaving(false);
        }
    };


    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-6 w-6 text-muted-foreground" />
                        <CardTitle>Add Pre-verified Payment</CardTitle>
                    </div>
                    <CardDescription>
                        Manually add a transaction ID and an amount here. When a user submits this ID during purchase, their license will be activated automatically if the amount is sufficient.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Alert>
                        <Banknote className="h-4 w-4" />
                        <AlertDescription>
                            This is the fast-track. Payments added here bypass the manual verification queue on the main Payments page.
                        </AlertDescription>
                    </Alert>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="transaction-id">M-Pesa / Airtel Transaction ID</Label>
                            <Input
                                id="transaction-id"
                                value={transactionId}
                                onChange={(e) => setTransactionId(e.target.value)}
                                placeholder="e.g., SAK1A2B3C4"
                                className="font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (KES)</Label>
                            <Input
                                id="amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="e.g., 1500"
                            />
                        </div>
                    </div>
                     <div className="flex justify-end">
                        <Button onClick={handleSaveCredit} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSaving ? 'Saving...' : 'Save Credit'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <PreVerifiedPaymentsList />
        </div>
    );
}
