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
import { AlertCircle, BrainCircuit } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface Prompt {
    id: string;
    name: string;
    content: string;
    version: number;
    lastModified: string;
}

export function PromptManagement() {
    const firestore = useFirestore();
    const promptsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'prompts');
    }, [firestore]);

    const { data: prompts, isLoading } = useCollection<Prompt>(promptsCollection);
    const { toast } = useToast();
    
    const [editablePrompts, setEditablePrompts] = useState<Prompt[]>([]);

    useEffect(() => {
        if (prompts) {
            setEditablePrompts(prompts);
        }
    }, [prompts]);

    const handleContentChange = (promptId: string, value: string) => {
        setEditablePrompts(prevPrompts => 
            prevPrompts.map(p => 
                p.id === promptId ? { ...p, content: value } : p
            )
        );
    };

    const handleSaveChanges = (promptId: string) => {
        if (!firestore) return;
        const promptToSave = editablePrompts.find(p => p.id === promptId);
        if (!promptToSave) return;

        const promptRef = doc(firestore, 'prompts', promptId);
        const updateData = {
            content: promptToSave.content,
            lastModified: new Date().toISOString(),
            version: (promptToSave.version || 1) + 1
        };

        updateDoc(promptRef, updateData).then(() => {
            toast({
                title: 'Success!',
                description: `Prompt "${promptToSave.name}" has been updated.`,
            });
        }).catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: promptRef.path,
                operation: 'update',
                requestResourceData: updateData
            }));
        });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <BrainCircuit className="h-6 w-6 text-muted-foreground" />
                    <CardTitle>System Prompt Control</CardTitle>
                </div>
                <CardDescription>
                    Edit the core AI prompts that drive the prediction and support engines. Changes here directly affect AI behavior.
                    <span className="font-bold text-warning"> Edit with caution.</span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="border rounded-lg p-4">
                                <Skeleton className="h-6 w-1/3 mb-4" />
                                <Skeleton className="h-24 w-full" />
                                <Skeleton className="h-9 w-20 mt-4 ml-auto" />
                            </div>
                        ))}
                    </div>
                ) : editablePrompts.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                        {editablePrompts.map(prompt => (
                            <AccordionItem key={prompt.id} value={prompt.id}>
                                <AccordionTrigger className="text-lg font-semibold">{prompt.name}</AccordionTrigger>
                                <AccordionContent className="space-y-4">
                                    <Textarea
                                        value={prompt.content}
                                        onChange={(e) => handleContentChange(prompt.id, e.target.value)}
                                        className="w-full min-h-[250px] font-code text-xs leading-5"
                                        placeholder="Enter prompt content..."
                                    />
                                    <div className="flex justify-end">
                                        <Button onClick={() => handleSaveChanges(prompt.id)}>Save Changes</Button>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <div className="text-center h-24 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <AlertCircle className="h-5 w-5" />
                        No prompts found in the database.
                        <p className="text-xs">Run the seed script (`npx tsx src/lib/seed-prompts.ts`) to populate default prompts.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
