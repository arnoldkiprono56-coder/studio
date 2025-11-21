
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const premiumPlans = [
    {
        name: 'Standard',
        price: '999',
        priceSuffix: '/month',
        description: 'For casual players looking for an edge.',
        features: [
            'Access to all game predictions',
            'Standard AI accuracy',
            'Basic support',
            'Daily VIP Slip (1)',
        ],
        href: '/purchase/standard-premium',
        isRecommended: false,
    },
    {
        name: 'Pro',
        price: '1999',
        priceSuffix: '/month',
        description: 'For serious players who want higher accuracy.',
        features: [
            'Access to all game predictions',
            'Enhanced AI accuracy (learns from your plays)',
            'Priority support',
            'Daily VIP Slips (3)',
            'Early access to new game models',
        ],
        href: '/purchase/pro-premium',
        isRecommended: true,
    },
    {
        name: 'Elite',
        price: '4999',
        priceSuffix: '/month',
        description: 'For professional players who demand the best.',
        features: [
            'All features from Pro',
            'Highest AI accuracy',
            '24/7 dedicated support',
            'Unlimited daily VIP Slips',
            'Direct access to analysts',
        ],
        href: '/purchase/elite-premium',
        isRecommended: false,
    },
];

export default function PremiumPage() {
    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-4xl font-bold tracking-tight">Premium Plans</h1>
                <p className="mt-2 text-lg text-muted-foreground">Unlock the full power of PredictPro and maximize your winning potential.</p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                {premiumPlans.map((plan) => (
                    <Card key={plan.name} className={cn('flex flex-col', plan.isRecommended && 'border-primary border-2 shadow-primary/20 shadow-lg')}>
                        {plan.isRecommended && (
                            <div className="py-1 px-4 bg-primary text-primary-foreground text-center text-sm font-semibold rounded-t-lg">
                                Recommended
                            </div>
                        )}
                        <CardHeader>
                            <CardTitle className="text-2xl">{plan.name}</CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-6">
                            <div className="flex items-baseline">
                                <span className="text-4xl font-bold">KES {plan.price}</span>
                                <span className="ml-1 text-muted-foreground">{plan.priceSuffix}</span>
                            </div>
                            <ul className="space-y-3">
                                {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5 text-success" />
                                        <span className="text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter className="flex-col gap-4">
                            <Button asChild className="w-full" size="lg" variant={plan.isRecommended ? 'default' : 'secondary'}>
                                <Link href={plan.href}>Upgrade to {plan.name}</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
             <Card className="mt-8">
                <CardHeader>
                    <CardTitle>How to Pay</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                        To purchase a plan, click the upgrade button and follow the instructions. All payments are processed manually via M-Pesa or Airtel Money for your security.
                    </p>
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="font-semibold">Payment Details:</p>
                        <ul className="list-disc pl-5 mt-2 text-sm">
                            <li>M-Pesa Paybill: <span className="font-bold">XXXXXX</span></li>
                            <li>Account Number: <span className="font-bold">Your User ID</span></li>
                            <li>Airtel Money: <span className="font-bold">07XX XXX XXX</span></li>
                        </ul>
                         <p className="text-xs text-muted-foreground mt-2">After payment, you will be prompted to enter the transaction ID for verification.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
