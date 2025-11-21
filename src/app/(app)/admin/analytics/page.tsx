
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, BarChart } from 'lucide-react';
import { PredictionsChart } from './predictions-chart';
import { BannedUsers } from './banned-users';
import { PredictionSuccessRate } from './prediction-success-rate';


export default function AdminAnalyticsPage() {
    return (
        <div className="space-y-8">
             <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/admin">
                        <ArrowLeft />
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
                    <BarChart className="h-7 w-7" />
                    Platform Analytics
                </h1>
            </div>
            
            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <PredictionsChart />
                </div>
                <div className="lg:col-span-1">
                    <PredictionSuccessRate />
                </div>
            </div>

            <div>
                <BannedUsers />
            </div>

        </div>
    );
}

