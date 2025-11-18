'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, ArrowLeft, Ticket } from "lucide-react";
import { generateVipSlip, GenerateVipSlipOutput } from '@/ai/flows/generate-vip-slip';
import Link from 'next/link';
import { useProfile } from '@/context/profile-context';

export default function VipSlipPage() {
    const [prediction, setPrediction] = useState<GenerateVipSlipOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [roundsRemaining] = useState(99); // Mock data
    const { userProfile, openOneXBetDialog } = useProfile();

    const handleGetPrediction = async () => {
        if (!userProfile?.oneXBetId) {
            openOneXBetDialog();
            return;
        }
        setIsLoading(true);
        setPrediction(null);
        try {
            // Mock user and license IDs for now
            const result = await generateVipSlip({ userId: userProfile.id, licenseId: 'license-abc' });
            setPrediction(result);
        } catch (error) {
            console.error("Failed to get VIP slip:", error);
            // Optionally, show an error message to the user
        } finally {
            setIsLoading(false);
        }
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
                    {isLoading ? (
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
                            <p>No prediction generated yet.</p>
                            {!userProfile?.oneXBetId && <p className='text-sm text-amber-500 mt-2'>Please set your 1xBet ID to generate predictions.</p>}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex-col gap-4 border-t pt-6">
                     <div className="flex w-full items-center justify-between">
                        <p className="text-sm">Rounds Remaining: <span className="font-bold">{roundsRemaining}</span></p>
                        <Button onClick={handleGetPrediction} disabled={isLoading} size="lg">
                            {isLoading ? 'Generating...' : 'Generate VIP Slip'}
                        </Button>
                     </div>
                </CardFooter>
            </Card>
        </div>
    );
}
