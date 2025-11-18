'use client';

import { useState, useEffect } from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Tag } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Plan {
    id: string;
    name: string;
    price: number;
    currency: string;
    rounds: number;
}

export function PricingManagement() {
    const firestore = useFirestore();
    const plansCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'plans');
    }, [firestore]);

    const { data: plans, isLoading } = useCollection<Plan>(plansCollection);
    const { toast } = useToast();
    
    const [editablePlans, setEditablePlans] = useState<Plan[]>([]);

    useEffect(() => {
        if (plans) {
            setEditablePlans(plans);
        }
    }, [plans]);

    const handleInputChange = (planId: string, field: 'price' | 'rounds', value: string) => {
        const numericValue = Number(value);
        if (isNaN(numericValue)) return;

        setEditablePlans(prevPlans => 
            prevPlans.map(p => 
                p.id === planId ? { ...p, [field]: numericValue } : p
            )
        );
    };

    const handleSaveChanges = async (planId: string) => {
        if (!firestore) return;
        const planToSave = editablePlans.find(p => p.id === planId);
        if (!planToSave) return;

        const planRef = doc(firestore, 'plans', planId);
        try {
            await updateDoc(planRef, {
                price: planToSave.price,
                rounds: planToSave.rounds
            });
            toast({
                title: 'Success!',
                description: `${planToSave.name} plan has been updated.`,
            });
        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: `Could not update plan: ${error.message}`,
            });
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Tag className="h-6 w-6 text-muted-foreground" />
                    <CardTitle>Plans & Pricing Control</CardTitle>
                </div>
                <CardDescription>Edit license prices and the number of rounds per plan.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Plan Name</TableHead>
                            <TableHead>Price (KES)</TableHead>
                            <TableHead>Rounds</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : editablePlans.length > 0 ? (
                            editablePlans.map(plan => (
                                <TableRow key={plan.id}>
                                    <TableCell className="font-medium">{plan.name}</TableCell>
                                    <TableCell>
                                        <Input 
                                            type="number" 
                                            value={plan.price}
                                            onChange={(e) => handleInputChange(plan.id, 'price', e.target.value)}
                                            className="w-28"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input 
                                            type="number" 
                                            value={plan.rounds}
                                            onChange={(e) => handleInputChange(plan.id, 'rounds', e.target.value)}
                                            className="w-24"
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button onClick={() => handleSaveChanges(plan.id)}>Save</Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">
                                     <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                        <AlertCircle className="h-5 w-5" />
                                        No pricing plans found.
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

    