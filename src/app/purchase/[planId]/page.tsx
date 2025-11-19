'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useProfile } from '@/context/profile-context';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc, collection, writeBatch, getDoc, runTransaction, DocumentReference } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, CreditCard, ShieldCheck, Tag, CircleCheck } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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

    const [paymentMethod, setPaymentMethod] = useState('mpesa');
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

        setIsProcessing(true);

        try {
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
                    createdAt: new Date().toISOString(),
                };
                transaction.set(licenseRef, licensePayload);

                // 2. Create a new payment transaction document
                const transactionId = `txn_purchase_${Date.now()}`;
                const transactionRef = doc(firestore, 'transactions', transactionId);
                const transactionPayload = {
                    id: transactionId,
                    userId: userProfile.id,
                    licenseId: licenseId,
                    amount: plan.price,
                    currency: plan.currency,
                    paymentMethod: paymentMethod,
                    status: 'pending',
                    type: 'purchase',
                    description: `Purchase of ${plan.name} license`,
                    createdAt: new Date().toISOString(),
                };
                transaction.set(transactionRef, transactionPayload);

                // 3. Handle referral commission if applicable
                const isFirstPurchase = !(currentUserData?.hasPurchased);
                if (isFirstPurchase && currentUserData?.referredBy) {
                    const referrerRef = doc(firestore, 'users', currentUserData.referredBy);
                    const referrerSnap = await transaction.get(referrerRef);
                    if (!referrerSnap.exists()) {
                        console.warn(`Referrer with ID ${currentUserData.referredBy} not found. Skipping commission.`);
                        return;
                    }

                    // Create commission transaction for the referrer
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
                        createdAt: new Date().toISOString(),
                    };
                    transaction.set(commissionTxnRef, commissionPayload);

                    // Update referrer's balance
                    const referrerData = referrerSnap.data();
                    const newBalance = (referrerData?.balance || 0) + COMMISSION_AMOUNT;
                    transaction.update(referrerRef, { balance: newBalance });
                    
                    // Mark current user as having made a purchase
                    transaction.update(userRef, { hasPurchased: true });
                }
            });

            toast({ title: 'Processing', description: 'Your order has been placed and is pending verification.' });
            router.push('/purchase/success');

        } catch (error: any) {
             if (error.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: 'transactions',
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
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Select Payment Method</h3>
                        <RadioGroup defaultValue="mpesa" value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                             <Label htmlFor="mpesa" className="flex items-center gap-4 p-4 border rounded-md has-[:checked]:border-primary has-[:checked]:bg-primary/5 cursor-pointer">
                                <RadioGroupItem value="mpesa" id="mpesa" />
                                <div>
                                    <p className="font-semibold">M-Pesa</p>
                                    <p className="text-sm text-muted-foreground">Pay with M-Pesa STK Push or Till Number.</p>
                                </div>
                            </Label>
                             <Label htmlFor="card" className="flex items-center gap-4 p-4 border rounded-md has-[:checked]:border-primary has-[:checked]:bg-primary/5 cursor-pointer">
                                <RadioGroupItem value="card" id="card" />
                                <div>
                                    <p className="font-semibold">Card</p>
                                    <p className="text-sm text-muted-foreground">Pay with Visa, Mastercard, or M-Pesa virtual card.</p>
                                </div>
                            </Label>
                        </RadioGroup>
                    </div>
                     <div className="text-center p-4 bg-muted/50 rounded-lg text-sm">
                        <p className="font-bold">Pay {formatCurrency(plan.price, plan.currency)} to Till Number: <span className="text-primary font-code">555444</span></p>
                        <p className="text-muted-foreground mt-1">Your license will be activated once payment is confirmed.</p>
                    </div>
                </CardContent>
                <CardFooter className="flex-col gap-4 border-t pt-6">
                     <Button 
                        size="lg" 
                        className="w-full"
                        onClick={handlePurchase}
                        disabled={isProcessing}
                    >
                        {isProcessing ? 'Processing...' : 'Complete Purchase'}
                    </Button>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Secure payments processed by our team.</p>
                </CardFooter>
            </Card>
        </div>
    )
}
