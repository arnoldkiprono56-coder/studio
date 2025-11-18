'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, ArrowLeft, Gem, ShieldAlert } from "lucide-react";
import { generateGamePredictions, GenerateGamePredictionsOutput } from '@/ai/flows/generate-game-predictions';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const GRID_SIZE = 25;

type GemsMinesPredictionData = {
    safeTiles: number;
    avoidTiles: number;
    pattern: string;
    risk: string;
}

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
    
    const gemsMinesData = prediction?.predictionData as GemsMinesPredictionData | undefined;

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
                                {gemsMinesData ? (
                                    <div className='space-y-2'>
                                        <p className="text-muted-foreground font-semibold">💎 Mines & Gems Prediction (1xBet)</p>
                                        <p>Safe Tiles: <span className='font-bold'>{gemsMinesData.safeTiles}</span></p>
                                        <p>Avoid Tiles: <span className='font-bold'>{gemsMinesData.avoidTiles}</span></p>
                                        <p>Pattern: <span className='font-bold'>{gemsMinesData.pattern}</span></p>
                                        <p>Risk: <span className='font-bold'>{gemsMinesData.risk}</span></p>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground">No prediction generated yet.</p>
                                )}
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

                 <Card>
                    <CardHeader>
                        <CardTitle>Prediction Grid</CardTitle>
                        <CardDescription>This is a conceptual grid. Use the data from the prediction.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="grid grid-cols-5 gap-2">
                            {Array.from({ length: GRID_SIZE }).map((_, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        "w-full aspect-square rounded-md flex items-center justify-center border bg-muted/30",
                                    )}
                                >
                                    {index % 4 === 0 && <Gem className="w-6 h-6 text-accent-pro" />}
                                    {index % 7 === 0 && <ShieldAlert className="w-6 h-6 text-warning" />}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
