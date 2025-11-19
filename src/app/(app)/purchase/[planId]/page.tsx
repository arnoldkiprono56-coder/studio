'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useProfile } from '@/context/profile-context';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc, collection, writeBatch, serverTimestamp, runTransaction } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, CreditCard, ShieldCheck, Tag, CircleCheck, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

interface Plan {
    id: string;
    name: string;
    price: number;
    currency: string;
    rounds: number;
}

const COMMISSION_AMOUNT = 150; // KES 150 commission

export default function PurchasePage() {
    const params = useParams();
    const planId = params.planId as string;
    const router = useRouter();
    const { toast } = useToast();
    const { userProfile } = useProfile();
    const firestore = useFirestore();

    const [transactionMessage, setTransactionMessage] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const planDocRef = useMemoFirebase(() => {
        if (!firestore || !planId) return null;
        return doc(firestore, 'plans', planId);
    }, [firestore, planId]);

    const { data: plan, isLoading } = useDoc<Plan>(planDocRef);

    const extractDetails = (message: string): { txId: string | null; amount: number | null } => {
        // Regex for M-PESA: e.g., "SAI... Confirmed. Ksh... sent to..." or "SAI... Confirmed. You have received..."
        const mpesaRegex = /(?:([A-Z0-9]{10})\sConfirmed\.)(?:\s.*Ksh([\d,]+\.\d{2}))?/i;
        const mpesaMatch = message.match(mpesaRegex);

        if (mpesaMatch) {
            return {
                txId: mpesaMatch[1],
                amount: mpesaMatch[2] ? parseFloat(mpesaMatch[2].replace(/,/g, '')) : null
            };
        }
        
        // Add other regex for Airtel if the format is known
        
        return { txId: null, amount: null };
    }

    const handlePurchase = async () => {
        if (!firestore || !userProfile || !plan) {
            toast({ variant: 'destructive', title: 'Error', description: 'Cannot process purchase. User or plan not found.' });
            return;
        }

        if (!transactionMessage.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please paste your transaction message.' });
            return;
        }
        
        const { txId, amount } = extractDetails(transactionMessage);

        if (!txId) {
            toast({
                variant: 'destructive',
                title: 'Invalid Message',
                description: 'Could not extract a valid Transaction ID from the message. Please paste the full, original message.'
            });
            return;
        }

        setIsProcessing(true);

        try {
            const transactionId = `txn_purchase_${Date.now()}`;

            await runTransaction(firestore, async (transaction) => {
                const userRef = doc(firestore, 'users', userProfile.id);
                const userSnap = await transaction.get(userRef);
                if (!userSnap.exists()) {
                    throw new Error("User data not found.");
                }
                const currentUserData = userSnap.data();

                // 1. Create a new license document
                const licenseId = `${plan.id}-${userProfile.id}`;
                const licenseRef = doc(firestore, 'users', userProfile.id, 'user_licenses', licenseId);
                const licensePayload = {
                    id: licenseId,
                    userId: userProfile.id,
                    gameType: plan.name,
                    roundsRemaining: plan.rounds,
                    paymentVerified: false,
                    isActive: false,
                    createdAt: serverTimestamp(),
                };
                transaction.set(licenseRef, licensePayload);

                // 2. Create a new payment transaction document
                const transactionRef = doc(firestore, 'transactions', transactionId);
                const transactionPayload = {
                    id: transactionId,
                    userId: userProfile.id,
                    licenseId: licenseId,
                    userClaimedAmount: amount ?? plan.price, // Use extracted amount if available
                    finalAmount: null,
                    currency: plan.currency,
                    userSubmittedTxId: txId,
                    finalTxId: null,
                    status: 'pending',
                    type: 'purchase',
                    description: `Purchase of ${plan.name} license`,
                    rawMessage: transactionMessage,
                    createdAt: serverTimestamp(),
                };
                transaction.set(transactionRef, transactionPayload);

                // 3. Handle referral commission if applicable
                const isFirstPurchase = !(currentUserData?.hasPurchased);
                if (isFirstPurchase && currentUserData?.referredBy) {
                     const referrerRef = doc(firestore, 'users', currentUserData.referredBy);
                    // No need to get and check existence inside a transaction, it's optimistic
                    // Just queue up the updates.
                    const commissionTxnId = `txn_commission_${Date.now()}`;
                    const commissionTxnRef = doc(firestore, 'transactions', commissionTxnId);
                    const commissionPayload = {
                        id: commissionTxnId,
                        userId: currentUserData.referredBy,
                        type: 'commission',
                        description: `Referral commission from ${userProfile.email}`,
                        amount: COMMISSION_AMOUNT,
                        currency: 'KES',
                        status: 'completed',
                        createdAt: serverTimestamp(),
                    };
                    transaction.set(commissionTxnRef, commissionPayload);

                    // Update referrer's balance by getting current and adding to it
                    const referrerSnap = await transaction.get(referrerRef);
                    if(referrerSnap.exists()){
                        const referrerData = referrerSnap.data();
                        const newBalance = (referrerData.balance || 0) + COMMISSION_AMOUNT;
                        transaction.update(referrerRef, { balance: newBalance });
                    }
                    
                    transaction.update(userRef, { hasPurchased: true });
                }
            });

            toast({ title: 'Processing', description: 'Your order has been placed and is pending verification.' });
            router.push('/purchase/success');

        } catch (error: any) {
             if (error.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: 'transactions', // This is a transaction, path is complex.
                    operation: 'write',
                    requestResourceData: { planId, userId: userProfile.id }
                }));
            } else {
                console.error("Purchase failed:", error);
                toast({ variant: 'destructive', title: 'Purchase Failed', description: error.message || 'An unexpected error occurred.' });
            }
        } finally {
            setIsProcessing(false);
        }
    };


    if (isLoading || !plan) {
        return (
            <div className="max-w-xl mx-auto">
                <Skeleton className="h-9 w-48 mb-6" />
                <Card>
                    <CardHeader><Skeleton className="h-8 w-2/3" /><Skeleton className="h-4 w-1/3 mt-2" /></CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="h-12 w-full" />
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/games">
                        <ArrowLeft />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
                    <p className="text-muted-foreground">Complete your purchase for the {plan.name} license.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2"><Tag className="w-5 h-5 text-primary"/>{plan.name} License</CardTitle>
                        <p className="text-3xl font-bold text-primary">{formatCurrency(plan.price, plan.currency)}</p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 border-t pt-6">
                     <div className="text-center p-4 bg-muted/50 rounded-lg text-sm">
                        <p className="font-bold">1. Send Money: {formatCurrency(plan.price, plan.currency)} to <span className="text-primary font-code">0784667400</span></p>
                        <p className="text-muted-foreground mt-1">Use M-Pesa or Airtel Money.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="transaction-message" className="font-bold">2. Paste your payment confirmation message</Label>
                        <Textarea 
                            id="transaction-message"
                            value={transactionMessage}
                            onChange={(e) => setTransactionMessage(e.target.value)}
                            placeholder="e.g., SAI... Confirmed. Ksh1,500.00 sent to..."
                            className="min-h-[120px] font-mono text-xs"
                        />
                        <p className="text-xs text-muted-foreground">The system will automatically extract the transaction ID and amount.</p>
                    </div>
                </CardContent>
                <CardFooter className="flex-col gap-4 border-t pt-6">
                     <Button 
                        size="lg" 
                        className="w-full"
                        onClick={handlePurchase}
                        disabled={isProcessing}
                    >
                        {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {isProcessing ? 'Submitting...' : 'Submit for Verification'}
                    </Button>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Your payment will be manually verified by our team.</p>
                </CardFooter>
            </Card>
        </div>
    )
}
