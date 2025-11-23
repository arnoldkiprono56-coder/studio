'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { generateLocalPrediction, LocalPredictionOutput } from '@/services/local-prediction-service';
import Link from 'next/link';
import { useProfile } from '@/context/profile-context';
import { useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { addDoc, collection, doc, updateDoc, query, where, serverTimestamp, limit, orderBy, getDocs } from 'firebase/firestore';
import type { License, Prediction } from '@/lib/types';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useToast } from '@/hooks/use-toast';

type AviatorPredictionData = {
    targetMultiplier: string;
    riskLevel: string;
    confidence: number;
}

export default function AviatorPage() {
    const [prediction, setPrediction] = useState<LocalPredictionOutput | null>(null);
    const [lastPredictionId, setLastPredictionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [feedbackSent, setFeedbackSent] = useState(false);
    const { userProfile, openOneXBetDialog } = useProfile();
    const firestore = useFirestore();
    const { toast } = useToast();

    const licensesQuery = useMemoFirebase(() => {
        if (!userProfile?.id || !firestore) return null;
        return query(
            collection(firestore, 'users', userProfile.id, 'user_licenses'),
            where('gameType', '==', 'Aviator')
        );
    }, [userProfile?.id, firestore]);

    const { data: licenses, isLoading: licensesLoading } = useCollection<License>(licensesQuery);
    
    const activeLicense = licenses?.find(l => l.isActive && l.roundsRemaining > 0);
    const expiredLicense = licenses?.find(l => l.roundsRemaining <= 0);


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
        setLastPredictionId(null);

        // This now calls the local service instead of an AI flow
        const result = generateLocalPrediction({ gameType: 'aviator' });
        
        // Simulate a network delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1500));

        setPrediction(result);
        
        try {
            const predictionData = {
                userId: userProfile.id,
                licenseId: activeLicense.id,
                gameType: 'Aviator',
                predictionData: result.predictionData,
                disclaimer: result.disclaimer,
                status: 'pending' as const,
                timestamp: serverTimestamp(),
            };

            const newPredictionDoc = await addDoc(collection(firestore, 'users', userProfile.id, 'predictions'), predictionData)
                 .catch(error => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: `users/${userProfile.id}/predictions`,
                        operation: 'create',
                        requestResourceData: predictionData
                    }));
                    return null;
                });
            
            if (newPredictionDoc) {
                setLastPredictionId(newPredictionDoc.id);
            }


            const auditLogData = {
                userId: userProfile.id,
                action: 'prediction_request',
                details: `Game: Aviator, Prediction: ${JSON.stringify(result.predictionData)}`,
                timestamp: serverTimestamp(),
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
            const licenseRef = doc(firestore, 'users', userProfile.id, 'user_licenses', activeLicense.id);
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
            console.error("Failed to save prediction:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleFeedback = async (feedback: 'won' | 'lost') => {
        if (!lastPredictionId || !firestore || !userProfile) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save feedback. No prediction ID found.' });
            return;
        }
        setFeedbackSent(true);
        
        try {
            const predictionRef = doc(firestore, 'users', userProfile.id, 'predictions', lastPredictionId);
            await updateDoc(predictionRef, { status: feedback });
            toast({ title: 'Thank you!', description: 'Your feedback helps us improve.' });
        } catch (error) {
            console.error("Failed to update prediction status:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save your feedback.' });
        }
    };


    const aviatorData = prediction?.predictionData as AviatorPredictionData | undefined;
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
                    <p>No Aviator license found.</p>
                     <p className="text-xs text-muted-foreground">
                        Click <Link href="/support/chat/system?message=I%20want%20to%20activate%20an%20Aviator%20license" className="text-primary underline">here</Link> to activate.
                    </p>
                </div>
            )
        }
        if (expiredLicense) {
             return (
                <div className='text-center'>
                    <p className="font-semibold text-warning">Your license has expired.</p>
                    <p className="text-xs text-muted-foreground">
                        Click <Link href="/support/chat/system?message=I%20want%20to%20activate%20an%20Aviator%20license" className="text-primary underline">here</Link> to reactivate.
                    </p>
                </div>
             )
        }
        if (activeLicense) {
            return <p>Ready to generate prediction.</p>
        }
        return <p>Contact an admin to get a license.</p>
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
                    <h1 className="text-3xl font-bold tracking-tight">Aviator Predictions</h1>
                    <p className="text-muted-foreground">Generate random predictions for the Aviator game on 1xBet.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>New Prediction</CardTitle>
                    <CardDescription>Click the button to get the latest prediction. This will consume one prediction round.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center gap-6 min-h-[200px]">
                    {isLoading || licensesLoading ? (
                        <div className='text-center space-y-2'>
                           <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                           <p className='font-semibold text-muted-foreground'>Generating random prediction...</p>
                        </div>
                    ) : aviatorData ? (
                        <div className="text-center">
                            <p className="text-muted-foreground font-semibold">🎮 Aviator Prediction (1xBet)</p>
                            <p className="text-muted-foreground mt-2">Target Cashout</p>
                            <p className="text-6xl font-bold text-primary">{aviatorData.targetMultiplier}</p>
                            <p className="text-sm font-semibold text-muted-foreground mt-2">Cashout on or before this multiplier.</p>
                            <div className="flex gap-4 justify-center mt-4 text-sm text-muted-foreground">
                                <span>Risk Level: <span className="font-semibold text-foreground">{aviatorData.riskLevel}</span></span>
                                <span>Confidence: <span className="font-semibold text-foreground">{aviatorData.confidence}%</span></span>
                            </div>
                        </div>
                    ) : (
                         <div className="text-center text-muted-foreground">
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
                            {isLoading || licensesLoading ? 'Loading...' : 'Get Prediction'}
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
