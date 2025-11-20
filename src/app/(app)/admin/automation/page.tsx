'use client';

import { useState } from 'react';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Bot } from 'lucide-react';
import { useProfile } from '@/context/profile-context';
import Link from 'next/link';

const formSchema = z.object({
  transactionId: z.string().min(10, { message: 'Transaction ID must be at least 10 characters.' }),
  amount: z.coerce.number().min(1, { message: 'Amount must be greater than 0.' }),
});

export default function AutomationPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { userProfile } = useProfile();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            transactionId: '',
            amount: 0,
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!firestore || !userProfile) {
            toast({ variant: 'destructive', title: 'Error', description: 'Cannot submit. User not authenticated.' });
            return;
        }

        setIsSubmitting(true);
        const upperCaseTxId = values.transactionId.trim().toUpperCase();
        const docRef = doc(firestore, 'preVerifiedPayments', upperCaseTxId);

        const payload = {
            transactionId: upperCaseTxId,
            amount: values.amount,
            currency: 'KES',
            status: 'available',
            adminId: userProfile.id,
            createdAt: serverTimestamp(),
        };
        
        try {
            await setDoc(docRef, payload);
            toast({ title: 'Success', description: 'Pre-verified credit has been added.' });
            form.reset();
        } catch (error) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: docRef.path,
                operation: 'create',
                requestResourceData: payload,
            }));
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/admin">
                        <ArrowLeft />
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">System Automation</h1>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Bot className="h-6 w-6 text-muted-foreground" />
                        <CardTitle>Pre-verify a Payment</CardTitle>
                    </div>
                    <CardDescription>
                        Enter a transaction ID and amount to add it as a pre-verified credit. Users who submit this ID will have their purchase approved automatically. To see available credits, use the AI Assistant.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-md">
                            <FormField
                                control={form.control}
                                name="transactionId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Transaction ID</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., SAK1A2B3C4" {...field} className="font-mono" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Amount (KES)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="e.g., 1500" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add Pre-verified Credit
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
