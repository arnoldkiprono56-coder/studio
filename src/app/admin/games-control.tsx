'use client';

import { useState, useEffect } from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Gamepad2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface GameStatus {
    id: string;
    name: string;
    isEnabled: boolean;
    disabledReason: string;
}

export function GamesControl() {
    const firestore = useFirestore();
    const gameStatusCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'game_status');
    }, [firestore]);

    const { data: gameStatuses, isLoading } = useCollection<GameStatus>(gameStatusCollection);
    const { toast } = useToast();
    
    const [editableStatuses, setEditableStatuses] = useState<GameStatus[]>([]);

    useEffect(() => {
        if (gameStatuses) {
            setEditableStatuses(gameStatuses);
        }
    }, [gameStatuses]);

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
                {isLoading ? (
                    <div className="space-y-6">
                        {Array.from({ length: 3 }).map((_, i) => (
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
                ) : editableStatuses.length > 0 ? (
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
                ) : (
                    <div className="text-center h-24 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <AlertCircle className="h-5 w-5" />
                        No game statuses found in the database.
                        <p className="text-xs">Run the seed script (`npx tsx src/lib/seed-plans.ts`) to populate default data.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
