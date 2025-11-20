'use client';

import { useState } from 'react';
import { useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, doc, setDoc, serverTimestamp, query, where, orderBy, deleteDoc } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, Loader2, Bot, Trash2, AlertCircle } from 'lucide-react';
import { useProfile } from '@/context/profile-context';
import Link from 'next/link';

const formSchema = z.object({
  transactionId: z.string().min(10, { message: 'Transaction ID must be at least 10 characters.' }),
  amount: z.coerce.number().min(1, { message: 'Amount must be greater than 0.' }),
});

interface PreVerifiedPayment {
    id: string;
    transactionId: string;
    amount: number;
    currency: string;
    status: 'available' | 'claimed';
    adminId: string;
    createdAt: any;
}

function PreVerifiedPaymentsList() {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const paymentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'preVerifiedPayments'), where('status', '==', 'available'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: availablePayments, isLoading, forceRefetch } = useCollection<PreVerifiedPayment>(paymentsQuery);
    
    const handleDelete = async (paymentId: string) => {
        if (!firestore) return;
        const docRef = doc(firestore, 'preVerifiedPayments', paymentId);
        try {
            await deleteDoc(docRef);
            toast({ title: 'Success', description: 'Credit removed successfully.' });
            if (forceRefetch) forceRefetch();
        } catch (error) {
             errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: docRef.path,
                operation: 'delete'
            }));
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Available Credits</CardTitle>
                <CardDescription>A list of pre-verified transaction IDs that are available to be claimed by users.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date Added</TableHead>
                            <TableHead>Transaction ID</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                             Array.from({ length: 2 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell>
                                </TableRow>
                            ))
                        ) : availablePayments && availablePayments.length > 0 ? (
                            availablePayments.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell>{p.createdAt?.toDate().toLocaleDateString()}</TableCell>
                                    <TableCell className="font-mono">{p.transactionId}</TableCell>
                                    <TableCell>{formatCurrency(p.amount, p.currency)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="destructive" size="icon" onClick={() => handleDelete(p.id)}>
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Delete</span>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                             <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                     <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                        <AlertCircle className="h-5 w-5" />
                                        No available credits found.
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
                operation: 'write',
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
            <div className="grid gap-8 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Bot className="h-6 w-6 text-muted-foreground" />
                            <CardTitle>Pre-verify a Payment</CardTitle>
                        </div>
                        <CardDescription>
                            Enter a transaction ID and amount to add it as a pre-verified credit. Users who submit this ID will have their purchase approved automatically.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                                <Button type="submit" disabled={isSubmitting} className="w-full">
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Add Pre-verified Credit
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                <PreVerifiedPaymentsList />
            </div>
        </div>
    );
}
