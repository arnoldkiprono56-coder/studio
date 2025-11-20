
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useProfile } from '@/context/profile-context';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc, collection, writeBatch, serverTimestamp, runTransaction, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ShieldCheck, Tag, Loader2, CircleCheck } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Plan {
    id: string;
    name: string;
    price: number;
    currency: string;
    rounds: number;
}

interface PreVerifiedPayment {
    transactionId: string;
    amount: number;
    currency: string;
    status: 'available' | 'claimed';
    adminId: string;
    createdAt: string;
    claimedBy: string | null;
    claimedAt: string | null;
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
    const [remainingAmount, setRemainingAmount] = useState<number | null>(null);
    const [creditApplied, setCreditApplied] = useState<number | null>(null);

    const planDocRef = useMemoFirebase(() => {
        if (!firestore || !planId) return null;
        return doc(firestore, 'plans', planId);
    }, [firestore, planId]);

    const { data: plan, isLoading } = useDoc<Plan>(planDocRef);

    const extractDetails = (message: string): { txId: string | null; amount: number | null } => {
        const cleanedMessage = message.replace(/\s+/g, ' ').trim();
        
        // Universal regex for 10-character uppercase alphanumeric code (M-Pesa)
        const txIdMatch = cleanedMessage.match(/\b([A-Z0-9]{10})\b/);
        const txId = txIdMatch ? txIdMatch[0] : null;
    
        // Universal regex for amount (handles KES, Ksh, with/without commas)
        const amountMatch = cleanedMessage.match(/(?:KES|KSH)\s?([\d,]+\.?\d*)/i);
        const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;
    
        return { txId, amount };
    };

    const handlePurchase = async () => {
        if (!firestore || !userProfile || !plan) {
            toast({ variant: 'destructive', title: 'Error', description: 'Cannot process purchase. User or plan not found.' });
            return;
        }

        if (!transactionMessage.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please paste your transaction message.' });
            return;
        }
        
        setIsProcessing(true); // Start loading animation

        const { txId, amount: messageAmount } = extractDetails(transactionMessage);

        if (!txId) {
            toast({
                variant: 'destructive',
                title: 'Invalid Message',
                description: 'Could not extract a valid Transaction ID from the message. Please paste the full, original message.'
            });
            setIsProcessing(false); // Stop loading
            return;
        }

        try {
            // Check for pre-verified payment first
            const creditRef = doc(firestore, 'preVerifiedPayments', txId);
            const creditSnap = await getDoc(creditRef);

            if (creditSnap.exists() && creditSnap.data()?.status === 'available') {
                // Credit exists, apply it
                const creditData = creditSnap.data() as PreVerifiedPayment;
                const price = remainingAmount !== null ? remainingAmount : plan.price;
                const newRemaining = price - creditData.amount;
                
                if (newRemaining <= 0) {
                    // Credit covers the whole price, activate license directly
                    await activateLicenseWithCredit(txId, creditData.amount);
                    toast({ title: 'Success!', description: 'Your credit covered the full amount. License activated!' });
                    router.push('/purchase/success');
                } else {
                    // Credit partially covers the price, update UI
                    setRemainingAmount(newRemaining);
                    setCreditApplied(creditData.amount);
                    setTransactionMessage(''); // Clear message for next payment
                    toast({ title: 'Credit Applied!', description: `A credit of ${formatCurrency(creditData.amount)} was applied. Please pay the remaining balance.` });
                }
            } else {
                 // No credit, proceed with normal transaction
                await processNormalPurchase(txId, messageAmount);
                toast({ title: 'Processing', description: 'Your order has been placed and is pending verification.' });
                router.push('/purchase/success');
            }
        } catch (error: any) {
             if (error.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: `users/${userProfile.id}/transactions`, // Simplified path for the error
                    operation: 'create',
                    requestResourceData: { planId, userId: userProfile.id }
                }));
            } else {
                console.error("Purchase failed:", error);
                toast({ variant: 'destructive', title: 'Purchase Failed', description: error.message || 'An unexpected error occurred.' });
            }
        } finally {
            setIsProcessing(false); // Stop loading animation
        }
    };
    
    const activateLicenseWithCredit = async (claimedTxId: string, claimedAmount: number) => {
        if (!firestore || !userProfile || !plan) throw new Error("Missing dependencies for activation.");

        return runTransaction(firestore, async (transaction) => {
            const licenseId = `${plan.id}-${userProfile.id}`;
            const licenseRef = doc(firestore, 'users', userProfile.id, 'user_licenses', licenseId);
            transaction.set(licenseRef, {
                id: licenseId, userId: userProfile.id, gameType: plan.name, roundsRemaining: plan.rounds,
                paymentVerified: true, isActive: true, createdAt: serverTimestamp(),
            });

            const transactionRef = doc(collection(firestore, 'users', userProfile.id, 'transactions'));
            transaction.set(transactionRef, {
                id: transactionRef.id, userId: userProfile.id, licenseId,
                finalAmount: plan.price, currency: plan.currency, finalTxId: claimedTxId,
                status: 'verified', type: 'purchase', description: `Purchase of ${plan.name} with credit`,
                createdAt: serverTimestamp(),
            });

            const creditRef = doc(firestore, 'preVerifiedPayments', claimedTxId);
            transaction.update(creditRef, { status: 'claimed', claimedBy: userProfile.id, claimedAt: serverTimestamp() });
        });
    }

    const processNormalPurchase = async (txId: string, messageAmount: number | null) => {
        if (!firestore || !userProfile || !plan) throw new Error("Missing dependencies for purchase.");

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

                // 2. Create a new payment transaction document in the user's subcollection
                const transactionRef = doc(collection(firestore, 'users', userProfile.id, 'transactions'));
                const transactionPayload = {
                    id: transactionRef.id,
                    userId: userProfile.id,
                    licenseId: licenseId,
                    userClaimedAmount: messageAmount ?? (remainingAmount !== null ? remainingAmount : plan.price),
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
                     const referrerSnap = await transaction.get(referrerRef);
                    
                    if(referrerSnap.exists()){
                        const referrerData = referrerSnap.data();
                        const newBalance = (referrerData.balance || 0) + COMMISSION_AMOUNT;
                        transaction.update(referrerRef, { balance: newBalance });

                        // Create commission transaction for the referrer
                        const commissionTxnRef = doc(collection(firestore, 'users', currentUserData.referredBy, 'transactions'));
                        const commissionPayload = {
                            id: commissionTxnRef.id,
                            userId: currentUserData.referredBy,
                            type: 'commission',
                            description: `Referral commission from ${userProfile.email}`,
                            amount: COMMISSION_AMOUNT,
                            currency: 'KES',
                            status: 'completed',
                            createdAt: serverTimestamp(),
                        };
                        transaction.set(commissionTxnRef, commissionPayload);
                    }
                    
                    transaction.update(userRef, { hasPurchased: true });
                }
            });
    }


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
    
    const priceToPay = remainingAmount !== null ? remainingAmount : plan.price;

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
                        <p className="text-3xl font-bold text-primary">{formatCurrency(priceToPay, plan.currency)}</p>
                    </div>
                     {creditApplied && (
                        <Alert variant="default" className="mt-4 bg-success/10 border-success/30">
                            <CircleCheck className="h-4 w-4 text-success" />
                            <AlertTitle className="text-success">Credit Applied</AlertTitle>
                            <AlertDescription>
                                A credit of {formatCurrency(creditApplied)} has been applied. The remaining amount is shown above.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardHeader>
                <CardContent className="space-y-6 border-t pt-6">
                     <div className="text-center p-4 bg-muted/50 rounded-lg text-sm">
                        <p className="font-bold">1. Send Money: {formatCurrency(priceToPay, plan.currency)} to <span className="text-primary font-code">0786254674</span></p>
                        <p className="text-muted-foreground mt-1">Use M-Pesa or Airtel Money.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="transaction-message" className="font-bold">2. Paste your payment confirmation message</Label>
                        <Textarea 
                            id="transaction-message"
                            value={transactionMessage}
                            onChange={(e) => setTransactionMessage(e.target.value)}
                            placeholder="e.g., SAK... Confirmed. Ksh1,500.00 sent to..."
                            className="min-h-[120px] font-mono text-xs"
                        />
                        <p className="text-xs text-muted-foreground">The system will automatically extract the transaction ID and amount. If you have a credit, paste the credit transaction message here.</p>
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
                        {isProcessing ? 'Verifying...' : 'Submit for Verification'}
                    </Button>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Your payment will be verified by our team.</p>
                </CardFooter>
            </Card>
        </div>
    )
}
