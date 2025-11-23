
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, ArrowLeft, Gem, AlertCircle, Bomb } from "lucide-react";
import { generateLocalPrediction, LocalPredictionOutput } from '@/services/local-prediction-service';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useProfile } from '@/context/profile-context';
import { useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { addDoc, collection, doc, query, where, updateDoc, serverTimestamp, getDocs, limit } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { License, Prediction } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const GRID_SIZE = 25;

type GemsMinesPredictionData = {
    safeTileIndices: number[];
    risk: string;
}

type FeedbackState = 'none' | 'pending' | 'won' | 'lost_prompting' | 'lost_complete';


export default function GemsAndMinesPage() {
    const [prediction, setPrediction] = useState<LocalPredictionOutput | null>(null);
    const [lastPredictionId, setLastPredictionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [feedbackState, setFeedbackState] = useState<FeedbackState>('none');
    const [selectedMines, setSelectedMines] = useState<number[]>([]);


    const { userProfile, openOneXBetDialog } = useProfile();
    const firestore = useFirestore();
    const { toast } = useToast();

    // Fetch active license for this game
    const licensesQuery = useMemoFirebase(() => {
        if (!userProfile?.id || !firestore) return null;
        return query(
            collection(firestore, 'users', userProfile.id, 'user_licenses'),
            where('gameType', '==', 'Mines & Gems')
        );
    }, [userProfile?.id, firestore]);
    const { data: licenses, isLoading: licensesLoading } = useCollection<License>(licensesQuery);
    const activeLicense = licenses?.find(l => l.isActive && l.roundsRemaining > 0);
    const expiredLicense = licenses?.find(l => l.roundsRemaining <= 0);

    // Fetch user's prediction history to learn from
    const historyQuery = useMemoFirebase(() => {
        if (!userProfile?.id || !firestore) return null;
        return query(
            collection(firestore, 'users', userProfile.id, 'predictions'),
            where('gameType', '==', 'Mines & Gems'),
            limit(5) // Learn from the last 5 games
        );
    }, [userProfile?.id, firestore]);
    const { data: history, isLoading: historyLoading } = useCollection<Prediction>(historyQuery);


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
        setFeedbackState('none');
        setLastPredictionId(null);
        setSelectedMines([]);
        
        // Generate prediction using history
        const result = await generateLocalPrediction({ gameType: 'gems-mines', history: history || [] });
        
        // Simulate analysis delay
        await new Promise(resolve => setTimeout(resolve, 10000));

        setPrediction(result);
        setIsLoading(false); 
        setFeedbackState('pending');
            
        try {
            const predictionData = {
                userId: userProfile.id,
                licenseId: activeLicense.id,
                gameType: 'Mines & Gems',
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
                details: `Game: Gems & Mines, Prediction: ${JSON.stringify(result.predictionData)}`,
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
            toast({
                variant: 'destructive',
                title: 'Save Failed',
                description: 'Could not save the prediction to the database. Please try again.',
            });
        }
    };
    
     const handleMineSelection = (index: number) => {
        setSelectedMines(prev => {
            if (prev.includes(index)) {
                return prev.filter(i => i !== index);
            } else {
                return [...prev, index];
            }
        });
    };

    const handleFeedback = async (feedback: 'won' | 'lost') => {
       if (!lastPredictionId || !firestore || !userProfile) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save feedback. No prediction ID found.' });
            return;
        }

        if (feedback === 'lost') {
            if (selectedMines.length === 0) {
                 setFeedbackState('lost_prompting');
                 toast({ title: 'You Lost?', description: 'Please click all tiles where the mines were, then submit.' });
                 return;
            }
        }
        
        try {
            const predictionRef = doc(firestore, 'users', userProfile.id, 'predictions', lastPredictionId);
            const updatePayload: { status: 'won' | 'lost', mineLocations?: number[] } = { status: feedback };
            
            if (feedback === 'lost') {
                updatePayload.mineLocations = selectedMines;
            }

            await updateDoc(predictionRef, updatePayload);
            toast({ title: 'Thank you!', description: 'Your feedback helps us improve future predictions.' });

            if (feedback === 'won') {
                setFeedbackState('won');
            } else {
                setFeedbackState('lost_complete');
            }

        } catch (error) {
            console.error("Failed to update prediction status:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save your feedback.' });
        }
    };


    const gemsMinesData = prediction?.predictionData as GemsMinesPredictionData | undefined;
    const roundsRemaining = activeLicense?.roundsRemaining ?? 0;
    const canGenerate = !!activeLicense && !!userProfile?.oneXBetId && roundsRemaining > 0;

    const renderStatus = () => {
        if (licensesLoading || historyLoading) {
            return <p>Checking license status...</p>
        }
        if (!userProfile?.oneXBetId) {
            return <p className='text-sm text-amber-500 mt-2'>Please set your 1xBet ID to generate predictions.</p>
        }
        if (licenses && licenses.length === 0) {
            return (
                <div className='text-center'>
                    <p>No Mines &amp; Gems license found.</p>
                     <p className="text-xs text-muted-foreground">
                        Click <Link href="/support/chat/system?message=I%20want%20to%20activate%20a%20Mines%20&%20Gems%20license" className="text-primary underline">here</Link> to activate.
                    </p>
                </div>
            )
        }
        if (expiredLicense) {
             return (
                <div className='text-center'>
                    <p className="font-semibold text-warning">Your license has expired.</p>
                    <p className="text-xs text-muted-foreground">
                        Click <Link href="/support/chat/system?message=I%20want%20to%20activate%20a%20Mines%20&%20Gems%20license" className="text-primary underline">here</Link> to reactivate.
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
                    <h1 className="text-3xl font-bold tracking-tight">Gems &amp; Mines Predictions</h1>
                    <p className="text-muted-foreground">Generate smart predictions for the Gems &amp; Mines game on 1xBet.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>New Prediction</CardTitle>
                        <CardDescription>Click the button to get the latest prediction. This consumes one round.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center gap-6 min-h-[300px]">
                        {isLoading ? (
                             <div className='text-center space-y-2'>
                                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                                <p className='font-semibold text-muted-foreground'>Analyzing your history...</p>
                            </div>
                        ) : gemsMinesData ? (
                            <div className='space-y-2 text-center'>
                                <p className="text-muted-foreground font-semibold">💎 Mines &amp; Gems Prediction (1xBet)</p>
                                <p>Safest Tiles Found: <span className='font-bold text-foreground'>{gemsMinesData.safeTileIndices.length}</span></p>
                                <p>Risk Level: <span className='font-bold text-foreground'>{gemsMinesData.risk}</span></p>
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
                                disabled={isLoading || licensesLoading || historyLoading || !canGenerate} 
                                size="lg"
                            >
                                {isLoading || licensesLoading || historyLoading ? 'Loading...' : 'Get Prediction'}
                            </Button>
                        </div>
                        {prediction && (
                            <div className="w-full text-center space-y-3 pt-4">
                                {feedbackState === 'pending' && (
                                    <div className="animate-in fade-in-50 space-y-2">
                                        <p className="text-sm font-semibold">Did you win?</p>
                                        <div className="flex justify-center gap-2">
                                            <Button variant="outline" size="sm" onClick={() => handleFeedback('won')}>Yes</Button>
                                            <Button variant="outline" size="sm" onClick={() => handleFeedback('lost')}>No</Button>
                                        </div>
                                    </div>
                                )}
                                {(feedbackState === 'won' || feedbackState === 'lost_complete') && (
                                     <p className="text-sm text-success font-semibold animate-in fade-in-50">Thanks for your feedback!</p>
                                )}
                                 {feedbackState === 'lost_prompting' && (
                                    <div className="animate-in fade-in-50 space-y-2">
                                        <p className="text-sm text-warning font-semibold">Click the tiles where the mines were, then submit.</p>
                                        <Button size="sm" variant="destructive" onClick={() => handleFeedback('lost')} disabled={selectedMines.length === 0}>
                                            Submit {selectedMines.length} {selectedMines.length === 1 ? 'Mine' : 'Mines'}
                                        </Button>
                                    </div>
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
                             {feedbackState === 'lost_prompting' 
                                ? "Select all tiles that contained a mine."
                                : gemsMinesData 
                                ? "Follow the path of gems. If you lose, provide feedback." 
                                : "Your prediction will appear here."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="grid grid-cols-5 gap-2">
                            {Array.from({ length: GRID_SIZE }).map((_, index) => {
                                const isSafe = gemsMinesData?.safeTileIndices?.includes(index);
                                const isMinePrompt = feedbackState === 'lost_prompting';
                                const isSelectedMine = selectedMines.includes(index);
                                
                                return (
                                    <button
                                        key={index}
                                        disabled={!isMinePrompt}
                                        onClick={() => handleMineSelection(index)}
                                        className={cn(
                                            "w-full aspect-square rounded-md flex items-center justify-center border transition-all",
                                            // Default state
                                            'bg-muted/30',
                                            // Predicted safe tile
                                            isSafe && 'bg-green-500/20 border-green-500',
                                            // When prompting for mines
                                            isMinePrompt && 'cursor-pointer hover:bg-destructive/20 hover:border-destructive',
                                            // When a mine is selected by user
                                            isSelectedMine && 'bg-destructive/50 border-destructive ring-2 ring-destructive-foreground'
                                        )}
                                    >
                                        {isMinePrompt ? (
                                            <Bomb className={cn("w-6 h-6", isSelectedMine ? "text-white" : "text-muted-foreground")} />
                                        ) : isSafe ? (
                                            <Gem className="w-6 h-6 text-green-400" />
                                        ) : null}
                                    </button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
