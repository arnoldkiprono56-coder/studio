'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, doc, writeBatch, getDocs, query } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Database, Loader2, BrainCircuit } from 'lucide-react';
import defaultPrompts from '@/lib/seed-prompts';

const defaultPlans = [
    { id: 'vip-slip', name: 'VIP Slip', price: 1500, currency: 'KES', rounds: 100 },
    { id: 'aviator', name: 'Aviator', price: 799, currency: 'KES', rounds: 100 },
    { id: 'crash', name: 'Crash', price: 799, currency: 'KES', rounds: 100 },
    { id: 'mines-gems', name: 'Mines & Gems', price: 999, currency: 'KES', rounds: 100 }
];

const defaultGameStatuses = [
    { id: 'vip-slip', name: 'VIP Slip', isEnabled: true, disabledReason: '' },
    { id: 'aviator', name: 'Aviator', isEnabled: true, disabledReason: '' },
    { id: 'crash', name: 'Crash', isEnabled: true, disabledReason: '' },
    { id: 'mines-gems', name: 'Mines & Gems', isEnabled: true, disabledReason: '' }
];


export function DataSeeder() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isPlatformLoading, setIsPlatformLoading] = useState(false);
    const [isPromptsLoading, setIsPromptsLoading] = useState(false);

    const handleSeedPlatformData = async () => {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Firestore is not available.' });
            return;
        }

        setIsPlatformLoading(true);

        try {
            const batch = writeBatch(firestore);

            // Check existing plans
            const plansCollection = collection(firestore, 'plans');
            const plansSnapshot = await getDocs(query(plansCollection));
            const existingPlanIds = new Set(plansSnapshot.docs.map(d => d.id));
            let plansSeeded = 0;

            defaultPlans.forEach(plan => {
                if (!existingPlanIds.has(plan.id)) {
                    const planRef = doc(firestore, 'plans', plan.id);
                    batch.set(planRef, plan);
                    plansSeeded++;
                }
            });

            // Check existing game statuses
            const gameStatusCollection = collection(firestore, 'game_status');
            const gameStatusSnapshot = await getDocs(query(gameStatusCollection));
            const existingGameStatusIds = new Set(gameStatusSnapshot.docs.map(d => d.id));
            let gamesSeeded = 0;

            defaultGameStatuses.forEach(status => {
                if (!existingGameStatusIds.has(status.id)) {
                    const statusRef = doc(firestore, 'game_status', status.id);
                    batch.set(statusRef, status);
                    gamesSeeded++;
                }
            });

            if (plansSeeded === 0 && gamesSeeded === 0) {
                 toast({
                    title: 'No Action Needed',
                    description: 'All default platform data already exists.',
                });
            } else {
                await batch.commit();
                toast({
                    title: 'Success!',
                    description: `Seeded ${plansSeeded} new plans and ${gamesSeeded} new game statuses.`,
                });
            }
            
        } catch (error: any) {
            console.error('Seeding error:', error);
            toast({
                variant: 'destructive',
                title: 'Seeding Failed',
                description: error.message || 'An unexpected error occurred.',
            });
        } finally {
            setIsPlatformLoading(false);
        }
    };

    const handleSeedPrompts = async () => {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Firestore is not available.' });
            return;
        }

        setIsPromptsLoading(true);
        
        try {
            const batch = writeBatch(firestore);
            const promptsCollection = collection(firestore, 'prompts');
            const promptsSnapshot = await getDocs(query(promptsCollection));
            const existingPromptIds = new Set(promptsSnapshot.docs.map(d => d.id));
            let promptsSeeded = 0;

            defaultPrompts.forEach(prompt => {
                 if (!existingPromptIds.has(prompt.id)) {
                    const promptRef = doc(firestore, 'prompts', prompt.id);
                    batch.set(promptRef, {
                        name: prompt.name,
                        content: prompt.content.trim(),
                        version: 1,
                        lastModified: new Date().toISOString(),
                    });
                    promptsSeeded++;
                }
            });

            if (promptsSeeded === 0) {
                 toast({
                    title: 'No Action Needed',
                    description: 'All default AI prompts already exist.',
                });
            } else {
                await batch.commit();
                 toast({
                    title: 'Success!',
                    description: `Seeded ${promptsSeeded} new AI prompts.`,
                });
            }

        } catch (error: any) {
            console.error('Prompt seeding error:', error);
            toast({
                variant: 'destructive',
                title: 'Prompt Seeding Failed',
                description: error.message || 'An unexpected error occurred.',
            });
        } finally {
            setIsPromptsLoading(false);
        }
    }

    return (
        <div className="grid md:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Database className="h-6 w-6 text-muted-foreground" />
                        <CardTitle>Platform Data Seeding</CardTitle>
                    </div>
                    <CardDescription>
                        Populate the database with default game statuses and pricing plans. This is a one-time action
                        that should be run after the initial setup.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        Clicking the button below will create the default documents for:
                        VIP Slip, Aviator, Crash, and Mines &amp; Gems. It will not overwrite any existing data.
                    </p>
                    <Button onClick={handleSeedPlatformData} disabled={isPlatformLoading}>
                        {isPlatformLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isPlatformLoading ? 'Seeding...' : 'Seed Platform Data'}
                    </Button>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <BrainCircuit className="h-6 w-6 text-muted-foreground" />
                        <CardTitle>AI Prompt Seeding</CardTitle>
                    </div>
                    <CardDescription>
                        Populate the database with the default AI prompts required for Genkit flows to function correctly.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        Clicking this button ensures that the AI assistant and prediction generation have the necessary instructions. It will not overwrite existing prompts.
                    </p>
                    <Button onClick={handleSeedPrompts} disabled={isPromptsLoading}>
                        {isPromptsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isPromptsLoading ? 'Seeding...' : 'Seed Prompts'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
