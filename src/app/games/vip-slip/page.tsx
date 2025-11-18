'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, ArrowLeft, Ticket, AlertCircle } from "lucide-react";
import { generateVipSlip, GenerateVipSlipOutput } from '@/ai/flows/generate-vip-slip';
import Link from 'next/link';
import { useProfile } from '@/context/profile-context';
import { useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, where, doc, updateDoc, addDoc } from 'firebase/firestore';
import type { License } from '@/lib/types';
import { useCollection } from '@/firebase/firestore/use-collection';
import { adaptPredictionsBasedOnFeedback } from '@/ai/flows/adapt-predictions-based-on-feedback';
import { useToast } from '@/hooks/use-toast';

export default function VipSlipPage() {
    const [prediction, setPrediction] = useState<GenerateVipSlipOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [feedbackSent, setFeedbackSent] = useState(false);
    const { userProfile, openOneXBetDialog } = useProfile();
    const firestore = useFirestore();
    const { toast } = useToast();

    const licensesQuery = useMemoFirebase(() => {
        if (!userProfile?.id || !firestore) return null;
        return query(
            collection(firestore, 'users', userProfile.id, 'licenses'),
            where('gameType', '==', 'VIP Slip') 
        );
    }, [userProfile?.id, firestore]);

    const { data: licenses, isLoading: licensesLoading } = useCollection<License>(licensesQuery);
    
    const activeLicense = licenses?.find(l => l.isActive && l.paymentVerified && l.roundsRemaining > 0);
    const pendingLicense = licenses?.find(l => !l.paymentVerified);
    const expiredLicense = licenses?.find(l => l.paymentVerified && l.roundsRemaining <= 0);


    const handleGetPrediction = async () => {
        if (!userProfile?.oneXBetId) {
            openOneXBetDialog();
            return;
        }

        if (!activeLicense || !firestore || !userProfile) {
            console.error("No active license found, firestore not available, or user not loaded.");
            return;
        }

        setIsLoading(true);
        setPrediction(null);
        setFeedbackSent(false);
        try {
            const result = await generateVipSlip({ userId: userProfile.id, licenseId: activeLicense.id });
            setPrediction(result);

            const timestamp = new Date().toISOString();

            const predictionData = {
                userId: userProfile.id,
                licenseId: activeLicense.id,
                gameType: 'VIP Slip',
                predictionData: JSON.stringify(result.matches.map(m => `${m.teams}: ${m.prediction} @${m.odd}`)),
                disclaimer: result.disclaimer,
                timestamp: timestamp,
            };

            addDoc(collection(firestore, 'users', userProfile.id, 'predictions'), predictionData)
                .catch(error => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: `users/${userProfile.id}/predictions`,
                        operation: 'create',
                        requestResourceData: predictionData
                    }));
                });


            const auditLogData = {
                userId: userProfile.id,
                licenseId: activeLicense.id,
                action: 'prediction_request',
                details: `Game: VIP Slip, Prediction: ${JSON.stringify(result)}`,
                timestamp: timestamp,
                ipAddress: 'not_collected',
            };
            addDoc(collection(firestore, 'auditlogs'), auditLogData)
                .catch(error => {
                     errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: 'auditlogs',
                        operation: 'create',
                        requestResourceData: auditLogData
                    }));
                });

            // Decrement rounds remaining
            const licenseRef = doc(firestore, 'users', userProfile.id, 'licenses', activeLicense.id);
            const licenseUpdateData = {
                roundsRemaining: activeLicense.roundsRemaining - 1,
                isActive: (activeLicense.roundsRemaining - 1) > 0,
            };
            updateDoc(licenseRef, licenseUpdateData)
                .catch(error => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: licenseRef.path,
                        operation: 'update',
                        requestResourceData: licenseUpdateData
                    }));
                });

        } catch (error) {
            console.error("Failed to get VIP slip:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleFeedback = async (feedback: 'won' | 'lost') => {
        if (!prediction) return;
        setFeedbackSent(true);
        toast({ title: 'Thank you!', description: 'Your feedback helps us improve.' });
        try {
            await adaptPredictionsBasedOnFeedback({
                gameType: 'vip-slip',
                predictionData: JSON.stringify(prediction),
                feedback: feedback,
            });
        } catch (error) {
            console.error("Failed to send feedback:", error);
            // Optionally, revert feedbackSent state and show an error toast
            setFeedbackSent(false);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not submit feedback.' });
        }
    };

    const roundsRemaining = activeLicense?.roundsRemaining ?? 0;
    const canGenerate = !!activeLicense && !!userProfile?.oneXBetId && roundsRemaining > 0;

    const renderStatus = () => {
        if (licensesLoading) {
            return <p>Checking license status...</p>
        }
        if (!userProfile?.oneXBetId) {
            return <p className='text-sm text-amber-500 mt-2'>Please set your 1xBet ID to generate predictions.</p>
        }
        if (licenses && licenses.length === 0) {
            return (
                <div className='text-center'>
                    <p>No VIP Slip license found.</p>
                    <Button asChild variant="link"><Link href="/purchase/vip-slip">Purchase a License</Link></Button>
                </div>
            )
        }
        if (pendingLicense) {
            return <p className="font-semibold text-warning flex items-center gap-2"><AlertCircle size={16}/> Payment verification is pending. Please wait or contact support.</p>
        }
        if (expiredLicense) {
             return (
                <div className='text-center'>
                    <p className="font-semibold text-warning">Your license has expired. Please renew to continue.</p>
                    <Button asChild variant="link"><Link href="/purchase/vip-slip">Renew License</Link></Button>
                </div>
             )
        }
        if (activeLicense) {
            return <p>Ready to generate your VIP Slip.</p>
        }
        return <p>Purchase a license to generate VIP slips.</p>
    };


    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/games">
                        <ArrowLeft />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">VIP Slip</h1>
                    <p className="text-muted-foreground">Your premium AI-generated VIP slip for 1xBet.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>New VIP Slip</CardTitle>
                    <CardDescription>Click the button to generate a new slip. This will consume one prediction round.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center gap-6 min-h-[300px]">
                    {isLoading || licensesLoading ? (
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    ) : prediction ? (
                        <div className="w-full max-w-2xl space-y-4 bg-card p-6 rounded-xl border-2 border-primary/20 shadow-lg">
                            <div className="text-center pb-4 border-b border-dashed">
                                <h3 className="font-bold text-2xl flex items-center justify-center gap-2 text-primary">🎟️ VIP 1XBET SLIP</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    <span className="font-semibold">Date:</span> {new Date().toLocaleDateString()} | <span className="font-semibold">Slip Type:</span> {prediction.slipType}
                                </p>
                            </div>
                            <ul className="space-y-3 pt-4">
                                {prediction.matches.map((match, index) => (
                                    <li key={index} className="p-4 bg-muted/50 rounded-lg border">
                                        <p className="font-bold text-lg">{index + 1}) {match.teams}</p>
                                        <div className="flex justify-between items-center text-sm mt-1">
                                            <span className="text-muted-foreground">
                                                Market: <span className="font-medium text-foreground">{match.market}</span>
                                                <span className="mx-2">|</span>
                                                Prediction: <span className="font-medium text-foreground">{match.prediction}</span>
                                            </span>
                                            <span className="font-bold text-primary text-base bg-primary/10 px-2 py-1 rounded">{match.odd.toFixed(2)}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                         <div className="text-center text-muted-foreground">
                            <Ticket className="h-16 w-16 mx-auto mb-4" />
                            {renderStatus()}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex-col gap-4 border-t pt-6">
                    <div className="flex w-full items-center justify-between">
                        <p className="text-sm">Rounds Remaining: <span className="font-bold">{roundsRemaining}</span></p>
                        <Button 
                            onClick={handleGetPrediction} 
                            disabled={isLoading || licensesLoading || !canGenerate} 
                            size="lg"
                        >
                            {isLoading || licensesLoading ? 'Loading...' : 'Get New Slip'}
                        </Button>
                    </div>
                    {prediction && (
                        <div className="w-full text-center space-y-3 pt-4">
                            {!feedbackSent ? (
                                <div className="animate-in fade-in-50 space-y-2">
                                    <p className="text-sm font-semibold">Did you win?</p>
                                    <div className="flex justify-center gap-2">
                                        <Button variant="outline" size="sm" onClick={() => handleFeedback('won')}>Yes</Button>
                                        <Button variant="outline" size="sm" onClick={() => handleFeedback('lost')}>No</Button>
                                    </div>
                                </div>
                            ) : (
                                 <p className="text-sm text-success font-semibold animate-in fade-in-50">Thanks for your feedback!</p>
                            )}
                            <p className="text-xs text-muted-foreground">{prediction.disclaimer}</p>
                        </div>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
