
'use client';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { WifiOff, Signal } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { Logo } from './icons';

export function NetworkBlocker() {
    const { isCellular, isOnline, isLoading } = useNetworkStatus();

    // The app should only be accessible if the connection is cellular.
    const shouldBlock = !isCellular;

    if (isLoading) {
         return (
             <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm">
                <div className="flex items-center gap-4 mb-4">
                    <Logo className="w-10 h-10 text-primary animate-pulse" />
                    <h1 className="text-2xl font-bold">PredictPro</h1>
                </div>
                <Skeleton className="h-5 w-48" />
             </div>
        );
    }

    if (!shouldBlock) {
        return null; // Don't render the blocker if the connection is cellular.
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/95 backdrop-blur-sm">
            <div className="w-full max-w-md text-center p-8 border border-destructive rounded-2xl bg-card/80">
                <div className="mx-auto bg-destructive/10 p-4 rounded-full w-fit mb-4">
                    <WifiOff className="w-12 h-12 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold text-destructive mb-2">Connection Not Allowed</h2>
                <p className="text-muted-foreground">
                    {!isOnline
                        ? "You are currently offline. Please connect to the internet to continue."
                        : "This application can only be used on a mobile data network. Please turn off Wi-Fi and try again."
                    }
                </p>
                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Signal className="w-4 h-4 text-success" />
                    <span>Mobile Data Required</span>
                </div>
            </div>
        </div>
    );
}
