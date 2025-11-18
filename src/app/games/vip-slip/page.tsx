'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, ArrowLeft, Ticket, AlertCircle } from "lucide-react";
import { generateVipSlip, GenerateVipSlipOutput } from '@/ai/flows/generate-vip-slip';
import Link from 'next/link';
import { useProfile } from '@/context/profile-context';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import type { License } from '@/lib/types';
import { useCollection } from '@/firebase/firestore/use-collection';

export default function VipSlipPage() {
    const [prediction, setPrediction] = useState<GenerateVipSlipOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { userProfile, openOneXBetDialog } = useProfile();
    const firestore = useFirestore();

    const licensesQuery = useMemoFirebase(() => {
        if (!userProfile?.id || !firestore) return null;
        return query(
            collection(firestore, 'users', userProfile.id, 'licenses'),
            where('gameType', '==', 'VIP Slip') 
        );
    }, [userProfile?.id, firestore]);

    const { data: licenses, isLoading: licensesLoading } = useCollection<License>(licensesQuery);
    
    // An active license requires verified payment and rounds remaining.
    const activeLicense = licenses?.find(l => l.paymentVerified && l.roundsRemaining > 0);
    // A license that exists but is pending payment verification.
    const pendingLicense = licenses?.find(l => !l.paymentVerified);
    // A license that is paid for but has no rounds left.
    const expiredLicense = licenses?.find(l => l.paymentVerified && l.roundsRemaining <= 0);


    const handleGetPrediction = async () => {
        if (!userProfile?.oneXBetId) {
            openOneXBetDialog();
            return;
        }

        if (!activeLicense) {
            // This case should be handled by the UI state, but as a safeguard.
            console.error("No active license found.");
            return;
        }

        setIsLoading(true);
        setPrediction(null);
        try {
            const result = await generateVipSlip({ userId: userProfile.id, licenseId: activeLicense.id });
            setPrediction(result);

            // Decrement roundsRemaining
            const licenseRef = doc(firestore, 'users', userProfile.id, 'licenses', activeLicense.id);
            const newRounds = activeLicense.roundsRemaining - 1;
            await updateDoc(licenseRef, {
                roundsRemaining: newRounds,
                isActive: newRounds > 0, // Deactivate if rounds hit 0
            });

        } catch (error) {
            console.error("Failed to get VIP slip:", error);
            // Optionally, show an error message to the user
        } finally {
            setIsLoading(false);
        }
    };
    
    const roundsRemaining = activeLicense?.roundsRemaining ?? 0;
    const canGenerate = !!activeLicense;

    const renderStatus = () => {
        if (!userProfile?.oneXBetId) {
            return <p className='text-sm text-amber-500 mt-2'>Please set your 1xBet ID to generate predictions.</p>
        }
        if (licenses && licenses.length === 0) {
            return <p>No VIP Slip license found.</p>
        }
        if (pendingLicense) {
            return <p className="font-semibold text-warning flex items-center gap-2"><AlertCircle size={16}/> Payment verification is pending. Please wait or contact support.</p>
        }
        if (expiredLicense) {
             return <p className="font-semibold text-warning">Your license has expired after completing 100 rounds. Please renew to continue.</p>
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
                        <div className="w-full max-w-lg space-y-4">
                            <div className="flex justify-between items-center bg-accent/50 p-3 rounded-lg">
                                <h3 className="font-bold text-lg flex items-center gap-2"><Ticket className="text-primary"/> VIP 1xBet Slip</h3>
                                <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString()}</p>
                            </div>
                            <ul className="space-y-3">
                                {prediction.matches.map((match, index) => (
                                    <li key={index} className="p-3 bg-card rounded-md border">
                                        <p className="font-semibold">{match.teams}</p>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">{match.market}: <span className="font-medium text-foreground">{match.prediction}</span></span>
                                            <span className="font-bold text-primary">{match.odd.toFixed(2)}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <p className="text-xs text-center text-muted-foreground !mt-6">{prediction.disclaimer}</p>
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
                            {isLoading || licensesLoading ? 'Loading...' : 'Generate VIP Slip'}
                        </Button>
                     </div>
                </CardFooter>
            </Card>
        </div>
    );
}
