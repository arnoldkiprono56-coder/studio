'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Ticket, AlertCircle, BarChart } from "lucide-react";
import { generateLocalPrediction, LocalPredictionOutput } from '@/services/local-prediction-service';
import Link from 'next/link';
import { useProfile } from '@/context/profile-context';
import { useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, where, doc, updateDoc, addDoc, serverTimestamp, getDocs, limit } from 'firebase/firestore';
import type { License } from '@/lib/types';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useToast } from '@/hooks/use-toast';

export default function VipSlipPage() {
    const [prediction, setPrediction] = useState<LocalPredictionOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [team1, setTeam1] = useState('');
    const [team2, setTeam2] = useState('');

    const { userProfile, openOneXBetDialog } = useProfile();
    const firestore = useFirestore();
    const { toast } = useToast();

    const licensesQuery = useMemoFirebase(() => {
        if (!userProfile?.id || !firestore) return null;
        return query(
            collection(firestore, 'users', userProfile.id, 'user_licenses'),
            where('gameType', '==', 'VIP Slip')
        );
    }, [userProfile?.id, firestore]);

    const { data: licenses, isLoading: licensesLoading } = useCollection<License>(licensesQuery);
    
    const activeLicense = licenses?.find(l => l.isActive && l.roundsRemaining > 0);
    const expiredLicense = licenses?.find(l => l.roundsRemaining <= 0);


    const handleGetPrediction = async () => {
        if (!team1.trim() || !team2.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter both team names.' });
            return;
        }
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
        
        const result = generateLocalPrediction({ gameType: 'vip-slip', teams: { team1, team2 } });

        // Simulate a network delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setPrediction(result);
        
        try {
            const predictionData = {
                userId: userProfile.id,
                licenseId: activeLicense.id,
                gameType: 'VIP Slip',
                predictionData: {
                    teams: `${team1} vs ${team2}`,
                    ...result.predictionData
                },
                disclaimer: result.disclaimer,
                status: 'pending',
                timestamp: serverTimestamp(),
            };

            const newPredictionRef = await addDoc(collection(firestore, 'users', userProfile.id, 'predictions'), predictionData)
                .catch(error => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: `users/${userProfile.id}/predictions`,
                        operation: 'create',
                        requestResourceData: predictionData
                    }));
                    return null;
                });
            
            if (!newPredictionRef) {
                throw new Error("Failed to save prediction to database.");
            }

            const auditLogData = {
                userId: userProfile.id,
                action: 'prediction_request',
                details: `Game: VIP Slip, Match: ${team1} vs ${team2}`,
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
                title: 'Error',
                description: 'Could not save prediction. Please try again.',
            });
        } finally {
            setIsLoading(false);
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
                    <p className="text-xs text-muted-foreground">Licenses must be activated by an admin.</p>
                </div>
            )
        }
        if (expiredLicense) {
             return (
                <div className='text-center'>
                    <p className="font-semibold text-warning">Your license has expired.</p>
                    <p className="text-xs text-muted-foreground">Contact an admin to reactivate your license.</p>
                </div>
             )
        }
        if (activeLicense) {
            return <p className='text-sm text-muted-foreground'>Enter two teams to get a prediction.</p>
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
                    <h1 className="text-3xl font-bold tracking-tight">VIP Match Analysis</h1>
                    <p className="text-muted-foreground">Provide a match for local random analysis on 1xBet.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Match Details</CardTitle>
                    <CardDescription>Enter the two opposing teams you want to analyze. This will consume one round.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="team1">Team 1 (Home)</Label>
                            <Input id="team1" placeholder="e.g., Liverpool" value={team1} onChange={(e) => setTeam1(e.target.value)} disabled={isLoading || !canGenerate} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="team2">Team 2 (Away)</Label>
                            <Input id="team2" placeholder="e.g., Chelsea" value={team2} onChange={(e) => setTeam2(e.target.value)} disabled={isLoading || !canGenerate} />
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex-col gap-4 border-t pt-6">
                    <div className="flex w-full items-center justify-between">
                        <p className="text-sm">Rounds Remaining: <span className="font-bold">{roundsRemaining}</span></p>
                        <Button 
                            onClick={handleGetPrediction} 
                            disabled={isLoading || licensesLoading || !canGenerate || !team1 || !team2} 
                            size="lg"
                        >
                            {isLoading ? 'Analyzing...' : 'Analyze Match'}
                        </Button>
                    </div>
                </CardFooter>
            </Card>

            {isLoading && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center gap-4 min-h-[200px] pt-6">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className='font-semibold text-muted-foreground'>Generating random analysis...</p>
                    </CardContent>
                </Card>
            )}

            {prediction && (
                 <Card className="animate-in fade-in-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary"><BarChart /> Analysis Complete</CardTitle>
                        <CardDescription>{team1} vs {team2}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-center p-6 bg-muted/50 rounded-lg">
                            <p className="text-muted-foreground">Prediction</p>
                            <p className="text-3xl font-bold">{(prediction.predictionData as any).prediction}</p>
                            <p className="text-sm text-muted-foreground mt-1">Market: {(prediction.predictionData as any).market}</p>
                        </div>

                         <div className="p-4 bg-muted/30 rounded-lg">
                            <p className="text-sm font-semibold mb-2">Analysis Summary</p>
                            <p className="text-sm text-muted-foreground">{(prediction.predictionData as any).analysisSummary}</p>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-semibold">Confidence Score:</span>
                            <span className="font-bold text-lg text-primary">{(prediction.predictionData as any).confidence}%</span>
                        </div>
                    </CardContent>
                    <CardFooter className="text-xs text-muted-foreground pt-4 border-t">
                        {prediction.disclaimer}
                    </CardFooter>
                 </Card>
            )}
            
            {!isLoading && !prediction && (
                 <Card>
                    <CardContent className="flex flex-col items-center justify-center gap-2 min-h-[200px] pt-6 text-muted-foreground">
                        <Ticket className="h-12 w-12" />
                        {renderStatus()}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
