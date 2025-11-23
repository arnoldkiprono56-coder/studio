
'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, GlobeLock, WifiOff } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { Logo } from './icons';

interface LocationStatus {
    isBlocked: boolean;
    reason: 'country' | 'vpn' | null;
}

const messages = {
    country: {
        icon: GlobeLock,
        title: 'Access Denied',
        description: 'This application is only available for use within Kenya.',
    },
    vpn: {
        icon: ShieldAlert,
        title: 'VPN or Proxy Detected',
        description: 'Please disable your VPN or proxy service to continue. Access via masked IPs is not permitted.',
    },
    loading: {
        icon: null,
        title: 'Verifying Your Connection',
        description: 'Please wait while we confirm your access eligibility...',
    },
    offline: {
        icon: WifiOff,
        title: 'You Are Offline',
        description: 'Please check your internet connection and try again.',
    }
}

export function LocationBlocker() {
    const [status, setStatus] = useState<LocationStatus | null>(null);
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Set initial state
        setIsOnline(navigator.onLine);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        if (!isOnline) {
            // Don't fetch if offline
            setStatus(null);
            return;
        }

        fetch('/api/ip')
            .then(res => res.json())
            .then((data: LocationStatus) => {
                setStatus(data);
            })
            .catch(err => {
                console.error("Failed to fetch location status:", err);
                // Fail open - if the API check fails, allow access
                setStatus({ isBlocked: false, reason: null });
            });
    }, [isOnline]); // Refetch when network status changes

    const isLoading = status === null && isOnline;
    const shouldBlock = !isOnline || status?.isBlocked;
    
    let messageKey: keyof typeof messages = 'loading';
    if (!isOnline) {
        messageKey = 'offline';
    } else if (status?.isBlocked) {
        messageKey = status.reason || 'country';
    }
    
    const { icon: Icon, title, description } = messages[messageKey];

    if (!shouldBlock && !isLoading) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/95 backdrop-blur-sm">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center gap-4 mb-4">
                        <Logo className="w-10 h-10 text-primary animate-pulse" />
                        <h1 className="text-2xl font-bold">PredictPro</h1>
                    </div>
                    <Skeleton className="h-5 w-56" />
                 </div>
            ) : (
                <div className="w-full max-w-md text-center p-8 border border-destructive rounded-2xl bg-card/80">
                    {Icon && (
                        <div className="mx-auto bg-destructive/10 p-4 rounded-full w-fit mb-4">
                            <Icon className="w-12 h-12 text-destructive" />
                        </div>
                    )}
                    <h2 className="text-2xl font-bold text-destructive mb-2">{title}</h2>
                    <p className="text-muted-foreground">{description}</p>
                </div>
            )}
        </div>
    );
}

