'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Gem, Bomb } from "lucide-react";
import { generateGamePredictions, GenerateGamePredictionsOutput } from '@/ai/flows/generate-game-predictions';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const GRID_SIZE = 25;

export default function GemsAndMinesPage() {
    const [prediction, setPrediction] = useState<GenerateGamePredictionsOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGetPrediction = async () => {
        setIsLoading(true);
        setPrediction(null);
        try {
            // Assuming a mock user ID for now. This should be replaced with the actual logged-in user's ID.
            const result = await generateGamePredictions({ gameType: 'gems-mines', userId: 'user-123' });
            setPrediction(result);
        } catch (error) {
            console.error("Failed to get prediction:", error);
            // Optionally, show an error message to the user
        } finally {
            setIsLoading(false);
        }
    };
    
    const isSafe = (index: number) => prediction?.predictionData.safeTiles?.includes(index);
    const isGem = (index: number) => prediction?.predictionData.gemLocations?.includes(index);

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/games">
                        <ArrowLeft />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gems & Mines Predictions</h1>
                    <p className="text-muted-foreground">Generate AI-powered predictions for the Gems & Mines game on 1xBet.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>New Prediction</CardTitle>
                        <CardDescription>Click the button to get the latest prediction from our AI.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center gap-6 min-h-[200px]">
                        {isLoading ? (
                             <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        ): (
                            <div className="text-center">
                                {prediction ? (
                                    <>
                                        <p className="text-sm text-muted-foreground mt-2">Confidence: {(prediction.confidenceScore * 100).toFixed(0)}%</p>
                                        <p className="text-sm text-muted-foreground">Volatility: {prediction.volatilityAssessment}</p>
                                    </>
                                ) : (
                                    <p className="text-muted-foreground">No prediction generated yet.</p>
                                )}
                            </div>
                        )}
                        <Button onClick={handleGetPrediction} disabled={isLoading} size="lg">
                            {isLoading ? 'Generating...' : 'Get Prediction'}
                        </Button>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Prediction Grid</CardTitle>
                        <CardDescription>Revealed safe tiles and gem locations.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="grid grid-cols-5 gap-2">
                            {Array.from({ length: GRID_SIZE }).map((_, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        "w-full aspect-square rounded-md flex items-center justify-center border",
                                        prediction && isSafe(index) ? "bg-success/20 border-success" : "bg-muted/30",
                                        prediction && isGem(index) && "bg-accent-pro/20 border-accent-pro",
                                        prediction && !isSafe(index) && !isGem(index) && "bg-destructive/20 border-destructive"
                                    )}
                                >
                                    {prediction && isGem(index) && <Gem className="w-6 h-6 text-accent-pro" />}
                                    {prediction && !isSafe(index) && !isGem(index) && <Bomb className="w-6 h-6 text-destructive" />}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
