
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/context/profile-context";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Wallet as WalletIcon } from "lucide-react";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query } from "firebase/firestore";
import Link from "next/link";

interface Plan {
    id: string;
    name: string;
    price: number;
    currency: string;
}

export default function WalletPage() {
    const { userProfile, isProfileLoading } = useProfile();
    const firestore = useFirestore();

    const plansQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'plans'));
    }, [firestore]);

    const { data: plans, isLoading: plansLoading } = useCollection<Plan>(plansQuery);
    
    const isLoading = isProfileLoading || plansLoading;

    if (isLoading || !userProfile) {
        return (
            <div className="space-y-8">
                 <div className="space-y-2">
                    <Skeleton className="h-9 w-64" />
                    <Skeleton className="h-5 w-80" />
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-40" />
                    <Skeleton className="h-40" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-8 w-56" />
                    <div className="grid gap-6 sm:grid-cols-2">
                        <Skeleton className="h-48" />
                        <Skeleton className="h-48" />
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Wallet</h1>
                <p className="text-muted-foreground">Manage your balance and purchase new licenses.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Commission Balance</CardTitle>
                        <CardDescription>Earnings from your referrals.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{formatCurrency(userProfile.balance || 0)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Withdraw Funds</CardTitle>
                        <CardDescription>Transfer your earnings.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" disabled>Withdraw Funds (Coming Soon)</Button>
                    </CardContent>
                </Card>
            </div>

             <div>
                <h2 className="text-2xl font-semibold tracking-tight mb-4 flex items-center gap-2">
                    <WalletIcon className="w-6 h-6" />
                    Purchase a New License
                </h2>
                {plans && plans.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {plans.map(plan => (
                            <Card key={plan.id} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle>{plan.name}</CardTitle>
                                    <CardDescription>
                                        Get full access to {plan.name} predictions.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-3xl font-bold tracking-tight">
                                        {formatCurrency(plan.price, plan.currency)}
                                    </p>
                                    <p className="text-sm text-muted-foreground">for a full license</p>
                                </CardContent>
                                <CardContent>
                                    <Button asChild className="w-full">
                                        <Link href={`/purchase/${plan.id}`}>
                                            Purchase Now <ArrowRight className="w-4 h-4 ml-2" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground">No purchase plans available at the moment.</p>
                )}
            </div>
        </div>
    );
}
