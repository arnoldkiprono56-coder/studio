'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CircleCheck } from 'lucide-react';

export default function PurchaseSuccessPage() {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-lg text-center">
                <CardHeader>
                    <div className="mx-auto bg-success/20 p-3 rounded-full mb-4">
                        <CircleCheck className="w-12 h-12 text-success" />
                    </div>
                    <CardTitle className="text-2xl">Order Placed Successfully!</CardTitle>
                    <CardDescription>
                        Your order has been received and is currently being processed.
                        Your license will be activated automatically once the payment is verified by our team.
                        This usually takes a few minutes.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-x-4">
                        <Button asChild>
                            <Link href="/dashboard">Go to Dashboard</Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/support">Contact Support</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
