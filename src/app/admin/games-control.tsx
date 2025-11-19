'use client';

import { useState, useEffect } from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Gamepad2, Database } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface GameStatus {
    id: string;
    name: string;
    isEnabled: boolean;
    disabledReason: string;
}

const defaultGameStatuses: GameStatus[] = [
    { id: 'vip-slip', name: 'VIP Slip', isEnabled: true, disabledReason: '' },
    { id: 'aviator', name: 'Aviator', isEnabled: true, disabledReason: '' },
    { id: 'crash', name: 'Crash', isEnabled: true, disabledReason: '' },
    { id: 'mines-gems', name: 'Mines & Gems', isEnabled: true, disabledReason: '' }
];

export function GamesControl() {
    const firestore = useFirestore();
    const gameStatusCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'game_status');
    }, [firestore]);

    const { data: gameStatuses, isLoading, forceRefetch } = useCollection<GameStatus>(gameStatusCollection);
    const { toast } = useToast();
    
    const [editableStatuses, setEditableStatuses] = useState<GameStatus[]>([]);
    const [isSeeding, setIsSeeding] = useState(false);

    useEffect(() => {
        if (gameStatuses) {
            // Ensure all default games are present, adding missing ones
            const allStatuses = defaultGameStatuses.map(defaultStatus => {
                const existing = gameStatuses.find(s => s.id === defaultStatus.id);
                return existing || defaultStatus;
            });
            setEditableStatuses(allStatuses);
        } else if (!isLoading) {
            setEditableStatuses(defaultGameStatuses);
        }
    }, [gameStatuses, isLoading]);

    const handleToggle = (gameId: string, isEnabled: boolean) => {
        setEditableStatuses(prev => 
            prev.map(g => 
                g.id === gameId ? { ...g, isEnabled } : g
            )
        );
    };

    const handleReasonChange = (gameId: string, reason: string) => {
         setEditableStatuses(prev => 
            prev.map(g => 
                g.id === gameId ? { ...g, disabledReason: reason } : g
            )
        );
    };

    const handleSaveChanges = (gameId: string) => {
        if (!firestore) return;
        const statusToSave = editableStatuses.find(g => g.id === gameId);
        if (!statusToSave) return;

        const gameRef = doc(firestore, 'game_status', gameId);
        const updateData = {
            isEnabled: statusToSave.isEnabled,
            disabledReason: statusToSave.disabledReason,
        };

        updateDoc(gameRef, updateData).then(() => {
            toast({
                title: 'Success!',
                description: `${statusToSave.name} status has been updated.`,
            });
        }).catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: gameRef.path,
                operation: 'update',
                requestResourceData: updateData
            }));
        });
    };

    const handleSeedData = async () => {
        if (!firestore) {
            toast({ variant: "destructive", title: "Error", description: "Firestore is not available." });
            return;
        }
        setIsSeeding(true);
        try {
            const batch = writeBatch(firestore);
            defaultGameStatuses.forEach(status => {
                const docRef = doc(firestore, 'game_status', status.id);
                batch.set(docRef, status);
            });
            await batch.commit();
            toast({
                title: "Success!",
                description: "Default game statuses have been created.",
            });
            if(forceRefetch) forceRefetch();
        } catch (error: any) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: 'game_status',
                operation: 'write'
            }));
        } finally {
            setIsSeeding(false);
        }
    };

    const renderContent = () => {
        if (isLoading) {
             return (
                <div className="space-y-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="border rounded-lg p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-6 w-1/3" />
                                <Skeleton className="h-6 w-12" />
                            </div>
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-9 w-20 ml-auto" />
                        </div>
                    ))}
                </div>
            );
        }
        
        if (!gameStatuses || gameStatuses.length === 0) {
            return (
                <div className="text-center h-48 flex flex-col items-center justify-center gap-4 text-muted-foreground bg-muted/30 rounded-lg">
                    <Database className="h-10 w-10" />
                    <div className='space-y-1'>
                        <h3 className="font-semibold text-lg text-foreground">No Game Data Found</h3>
                        <p className="text-sm">The game statuses need to be initialized in the database.</p>
                    </div>
                    <Button onClick={handleSeedData} disabled={isSeeding}>
                        {isSeeding ? "Initializing..." : "Initialize Default Games"}
                    </Button>
                </div>
            );
        }

        return (
             <div className="space-y-6">
                {editableStatuses.map(game => (
                    <div key={game.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">{game.name}</h3>
                            <div className="flex items-center space-x-2">
                                <Label htmlFor={`switch-${game.id}`}>{game.isEnabled ? 'Enabled' : 'Disabled'}</Label>
                                <Switch
                                    id={`switch-${game.id}`}
                                    checked={game.isEnabled}
                                    onCheckedChange={(checked) => handleToggle(game.id, checked)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`reason-${game.id}`}>Disabled Reason</Label>
                            <Textarea
                                id={`reason-${game.id}`}
                                value={game.disabledReason}
                                onChange={(e) => handleReasonChange(game.id, e.target.value)}
                                className="w-full min-h-[80px]"
                                placeholder="e.g., 'Down for a security upgrade. Be back soon!'"
                                disabled={game.isEnabled}
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={() => handleSaveChanges(game.id)}>Save Changes</Button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Gamepad2 className="h-6 w-6 text-muted-foreground" />
                    <CardTitle>Games Control</CardTitle>
                </div>
                <CardDescription>
                    Enable or disable games for all users. Provide a reason when disabling a game.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
        </Card>
    );
}
