'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard } from 'lucide-react';
import { useProfile } from '@/context/profile-context';

export default function PreVerifiedPaymentsPage() {
    const firestore = useFirestore();
    const { userProfile } = useProfile();
    const { toast } = useToast();
    const [transactionId, setTransactionId] = useState('');
    const [amount, setAmount] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveCredit = async () => {
        if (!firestore || !userProfile) {
            toast({ variant: 'destructive', title: 'Error', description: 'Authentication error.' });
            return;
        }
        if (!transactionId.trim() || !amount.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Transaction ID and amount are required.' });
            return;
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a valid amount.' });
            return;
        }

        setIsSaving(true);
        const creditRef = doc(firestore, 'preVerifiedPayments', transactionId.trim().toUpperCase());

        try {
            await setDoc(creditRef, {
                transactionId: transactionId.trim().toUpperCase(),
                amount: parsedAmount,
                currency: 'KES',
                status: 'available', // 'available' or 'claimed'
                adminId: userProfile.id,
                createdAt: new Date().toISOString(),
                claimedBy: null,
                claimedAt: null,
            });

            toast({
                title: 'Credit Saved!',
                description: `Transaction ID ${transactionId.toUpperCase()} has been credited with KES ${parsedAmount}.`,
            });
            setTransactionId('');
            setAmount('');
        } catch (error: any) {
            console.error('Error saving pre-verified payment:', error);
            toast({
                variant: 'destructive',
                title: 'Save Failed',
                description: error.message || 'An unexpected error occurred.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <CreditCard className="h-6 w-6 text-muted-foreground" />
                    <CardTitle>Pre-verified Payments</CardTitle>
                </div>
                <CardDescription>
                    Manually credit a transaction ID with a specific amount. When a user makes a purchase with this ID, the amount will be deducted from the license price.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="transactionId">Transaction ID</Label>
                        <Input
                            id="transactionId"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            placeholder="e.g., SAK..."
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
                            placeholder="e.g., 500"
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
    );
}