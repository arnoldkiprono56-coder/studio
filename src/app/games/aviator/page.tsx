'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { generateGamePredictions, GenerateGamePredictionsOutput } from '@/ai/flows/generate-game-predictions';
import Link from 'next/link';
import { useProfile } from '@/context/profile-context';

type AviatorPredictionData = {
    targetMultiplier: string;
    riskLevel: string;
    confidence: number;
}

export default function AviatorPage() {
    const [prediction, setPrediction] = useState<GenerateGamePredictionsOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { userProfile, openOneXBetDialog } = useProfile();


    const handleGetPrediction = async () => {
        if (!userProfile?.oneXBetId) {
            openOneXBetDialog();
            return;
        }
        setIsLoading(true);
        setPrediction(null);
        try {
            const result = await generateGamePredictions({ gameType: 'aviator', userId: userProfile.id });
            setPrediction(result);
        } catch (error) {
            console.error("Failed to get prediction:", error);
            // Optionally, show an error message to the user
        } finally {
            setIsLoading(false);
        }
    };

    const aviatorData = prediction?.predictionData as AviatorPredictionData | undefined;

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
                    <p className="text-muted-foreground">Generate AI-powered predictions for the Aviator game on 1xBet.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>New Prediction</CardTitle>
                    <CardDescription>Click the button to get the latest prediction from our AI.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center gap-6 min-h-[200px]">
                    {isLoading ? (
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    ) : aviatorData ? (
                        <div className="text-center">
                            <p className="text-muted-foreground font-semibold">🎮 Aviator Prediction (1xBet)</p>
                            <p className="text-muted-foreground mt-2">Target Cashout</p>
                            <p className="text-6xl font-bold text-primary">{aviatorData.targetMultiplier}</p>
                            <p className="text-sm text-muted-foreground mt-2">Risk Level: {aviatorData.riskLevel}</p>
                            <p className="text-sm text-muted-foreground">Round Confidence: {aviatorData.confidence}%</p>
                        </div>
                    ) : (
                         <div className="text-center text-muted-foreground">
                            <p>No prediction generated yet.</p>
                            {!userProfile?.oneXBetId && <p className='text-sm text-amber-500 mt-2'>Please set your 1xBet ID to generate predictions.</p>}
                        </div>
                    )}
                    <Button onClick={handleGetPrediction} disabled={isLoading} size="lg">
                        {isLoading ? 'Generating...' : 'Get Prediction'}
                    </Button>
                </CardContent>
                {prediction && (
                    <CardFooter>
                        <p className="text-xs text-center text-muted-foreground w-full">{prediction.disclaimer}</p>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
