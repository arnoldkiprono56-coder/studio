
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

interface Plan {
    id: string;
    name: string;
    price: number;
    currency: string;
    rounds: number;
}

export default function PurchasePage() {
    const params = useParams();
    const planId = params.planId as string;
    const router = useRouter();
    const { toast } = useToast();
    const { userProfile } = useProfile();
    const firestore = useFirestore();

    const [transactionId, setTransactionId] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const planDocRef = useMemoFirebase(() => {
        if (!firestore || !planId) return null;
        return doc(firestore, 'plans', planId);
    }, [firestore, planId]);

    const { data: plan, isLoading } = useDoc<Plan>(planDocRef);

    const handlePurchase = async () => {
        if (!firestore || !userProfile || !plan) {
            toast({ variant: 'destructive', title: 'Error', description: 'Cannot process purchase. User or plan not found.' });
            return;
        }

        const upperCaseTxId = transactionId.trim().toUpperCase();
        if (!upperCaseTxId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter your transaction ID.' });
            return;
        }
        
        setIsProcessing(true);

        try {
            // 1. Check for a pre-verified payment first
            const preVerifiedRef = doc(firestore, 'preVerifiedPayments', upperCaseTxId);
            const preVerifiedSnap = await getDoc(preVerifiedRef);

            if (preVerifiedSnap.exists() && preVerifiedSnap.data()?.status === 'available') {
                const credit = preVerifiedSnap.data();
                // 2. If credit exists and is sufficient, process auto-approval
                if (credit.amount >= plan.price) {
                    await processAutoApprovedPurchase(plan, upperCaseTxId, credit.amount);
                    toast({ title: 'Success!', description: 'Your payment was instantly verified and your license is active.' });
                    router.push('/purchase/success');
                } else {
                    // If credit is insufficient, proceed to manual verification
                    await processNormalPurchase(plan, upperCaseTxId);
                    toast({ title: 'Processing', description: 'Your order has been placed and is pending verification.' });
                    router.push('/purchase/success');
                }
            } else {
                // 3. If no pre-verified credit, proceed to manual verification
                await processNormalPurchase(plan, upperCaseTxId);
                toast({ title: 'Processing', description: 'Your order has been placed and is pending verification.' });
                router.push('/purchase/success');
            }

        } catch (error: any) {
             if (error.code === 'permission-denied' || error.name === 'FirebaseError') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: `users/${userProfile.id}/transactions or preVerifiedPayments`,
                    operation: 'create',
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

    // This function is for purchases that need manual admin approval
    const processNormalPurchase = async (plan: Plan, txId: string) => {
        if (!firestore || !userProfile) return;
        
        await runTransaction(firestore, async (t) => {
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
            t.set(licenseRef, licensePayload);

            const transactionRef = doc(collection(firestore, 'users', userProfile.id, 'transactions'));
            const transactionPayload = {
                id: transactionRef.id,
                userId: userProfile.id,
                licenseId: licenseId,
                userClaimedAmount: plan.price,
                currency: plan.currency,
                userSubmittedTxId: txId,
                status: 'pending',
                type: 'purchase',
                description: `Purchase of ${plan.name} license`,
                createdAt: serverTimestamp(),
            };
            t.set(transactionRef, transactionPayload);
        });
    };

    // This function handles the instant activation for pre-verified payments
    const processAutoApprovedPurchase = async (plan: Plan, txId: string, verifiedAmount: number) => {
        if (!firestore || !userProfile) return;

        const batch = writeBatch(firestore);

        // 1. Create an active license
        const licenseId = `${plan.id}-${userProfile.id}`;
        const licenseRef = doc(firestore, 'users', userProfile.id, 'user_licenses', licenseId);
        const licensePayload = {
            id: licenseId,
            userId: userProfile.id,
            gameType: plan.name,
            roundsRemaining: plan.rounds,
            paymentVerified: true, // Auto-verified
            isActive: true, // Auto-active
            createdAt: serverTimestamp(),
        };
        batch.set(licenseRef, licensePayload);

        // 2. Create a 'completed' transaction record
        const transactionRef = doc(collection(firestore, 'users', userProfile.id, 'transactions'));
        const transactionPayload = {
            id: transactionRef.id,
            userId: userProfile.id,
            licenseId: licenseId,
            userClaimedAmount: plan.price,
            finalAmount: verifiedAmount,
            currency: plan.currency,
            userSubmittedTxId: txId,
            finalTxId: txId,
            status: 'completed', // Straight to completed
            type: 'purchase',
            description: `Auto-verified purchase of ${plan.name} license`,
            createdAt: serverTimestamp(),
        };
        batch.set(transactionRef, transactionPayload);

        // 3. Mark the pre-verified payment as 'claimed'
        const preVerifiedRef = doc(firestore, 'preVerifiedPayments', txId);
        batch.update(preVerifiedRef, {
            status: 'claimed',
            claimedBy: userProfile.id,
            claimedAt: serverTimestamp(),
        });
        
        await batch.commit();
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
                        <p className="font-bold">1. Send Money: {formatCurrency(plan.price, plan.currency)} to <span className="text-primary font-code">0786254674</span></p>
                        <p className="text-muted-foreground mt-1">Use M-Pesa or Airtel Money.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="transaction-id" className="font-bold">2. Enter your payment Transaction ID</Label>
                        <Input 
                            id="transaction-id"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            placeholder="e.g., SAK..."
                            className="font-mono text-base"
                        />
                        <p className="text-xs text-muted-foreground">Enter the 10-character transaction code you received (e.g., SAK123ABCDE).</p>
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
