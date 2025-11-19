'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, ArrowLeft, Gem, ShieldAlert, AlertCircle, Bomb } from "lucide-react";
import { generateGamePredictions, GenerateGamePredictionsOutput } from '@/ai/flows/generate-game-predictions';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useProfile } from '@/context/profile-context';
import { useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { addDoc, collection, doc, query, where, updateDoc } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { License } from '@/lib/types';
import { adaptPredictionsBasedOnFeedback } from '@/ai/flows/adapt-predictions-based-on-feedback';
import { useToast } from '@/hooks/use-toast';

const GRID_SIZE = 25;

type GemsMinesPredictionData = {
    safeTileIndices: number[];
    mineTileIndices: number[];
    risk: string;
}

export default function GemsAndMinesPage() {
    const [prediction, setPrediction] = useState<GenerateGamePredictionsOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [feedbackSent, setFeedbackSent] = useState(false);
    const { userProfile, openOneXBetDialog } = useProfile();
    const firestore = useFirestore();
    const { toast } = useToast();

    const licensesQuery = useMemoFirebase(() => {
        if (!userProfile?.id || !firestore) return null;
        return query(
            collection(firestore, 'users', userProfile.id, 'user_licenses'),
            where('gameType', '==', 'Mines & Gems')
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
            const result = await generateGamePredictions({ 
                gameType: 'gems-mines', 
                userId: userProfile.id,
            });
            setPrediction(result);
            
            const timestamp = new Date().toISOString();

            const predictionData = {
                userId: userProfile.id,
                licenseId: activeLicense.id,
                gameType: 'Gems & Mines',
                predictionData: JSON.stringify(result.predictionData),
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
                action: 'prediction_request',
                details: `Game: Gems & Mines, Prediction: ${JSON.stringify(result.predictionData)}`,
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
            console.error("Failed to get prediction:", error);
            // Optionally, show an error message to the user
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
                gameType: 'gems-mines',
                predictionData: JSON.stringify(prediction.predictionData),
                feedback: feedback,
            });
        } catch (error) {
            console.error("Failed to send feedback:", error);
            setFeedbackSent(false);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not submit feedback.' });
        }
    };

    const gemsMinesData = prediction?.predictionData as GemsMinesPredictionData | undefined;
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
                    <p>No Mines &amp; Gems license found.</p>
                    <Button asChild variant="link"><Link href="/purchase/mines-gems">Purchase a License</Link></Button>
                </div>
            )
        }
        if (pendingLicense) {
            return <p className="font-semibold text-warning flex items-center gap-2"><AlertCircle size={16}/> Payment verification is pending.</p>
        }
        if (expiredLicense) {
             return (
                <div className='text-center'>
                    <p className="font-semibold text-warning">Your license has expired.</p>
                    <Button asChild variant="link"><Link href="/purchase/mines-gems">Renew License</Link></Button>
                </div>
             )
        }
        if (activeLicense) {
            return <p>Ready to generate prediction.</p>
        }
        return <p>Purchase a license to generate predictions.</p>
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
                    <h1 className="text-3xl font-bold tracking-tight">Gems &amp; Mines Predictions</h1>
                    <p className="text-muted-foreground">Generate AI-powered predictions for the Gems &amp; Mines game on 1xBet.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>New Prediction</CardTitle>
                        <CardDescription>Click the button to get the latest prediction. This consumes one round.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center gap-6 min-h-[300px]">
                        {isLoading || licensesLoading ? (
                             <div className='text-center space-y-2'>
                                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                                <p className='font-semibold text-muted-foreground'>Connecting to 1xBet servers...</p>
                            </div>
                        ): gemsMinesData ? (
                            <div className='space-y-2 text-center'>
                                <p className="text-muted-foreground font-semibold">💎 Mines &amp; Gems Prediction (1xBet)</p>
                                <p>Safe Tiles (Gems): <span className='font-bold'>{gemsMinesData.safeTileIndices.length}</span></p>
                                <p>Mines to Avoid: <span className='font-bold'>{gemsMinesData.mineTileIndices.length}</span></p>
                                <p>Risk: <span className='font-bold'>{gemsMinesData.risk}</span></p>
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
                                {isLoading ? 'Loading...' : 'Get Prediction'}
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

                 <Card>
                    <CardHeader>
                        <CardTitle>Prediction Grid</CardTitle>
                        <CardDescription>
                             {gemsMinesData ? "Follow the path of gems and avoid the mines." : "Your prediction will appear here."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="grid grid-cols-5 gap-2">
                            {Array.from({ length: GRID_SIZE }).map((_, index) => {
                                const isMine = gemsMinesData?.mineTileIndices.includes(index);
                                const isSafe = gemsMinesData?.safeTileIndices.includes(index);
                                
                                return (
                                    <div
                                        key={index}
                                        className={cn(
                                            "w-full aspect-square rounded-md flex items-center justify-center border",
                                            isMine ? 'bg-destructive/20 border-destructive' : 'bg-muted/30',
                                            isSafe && 'bg-green-500/20 border-green-500',
                                        )}
                                    >
                                        {isMine && <Bomb className="w-6 h-6 text-destructive" />}
                                        {isSafe && <Gem className="w-6 h-6 text-green-400" />}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
