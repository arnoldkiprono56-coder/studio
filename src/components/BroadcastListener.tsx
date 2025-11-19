
'use client';

import { useState, useEffect } from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import { Megaphone } from 'lucide-react';
import { useProfile } from '@/context/profile-context';

interface Notification {
    id: string;
    message: string;
    targetAudience: 'all' | 'premium' | 'staff';
    createdAt: any;
}

const COOLDOWN_SECONDS = 20;

export function BroadcastListener() {
    const firestore = useFirestore();
    const { userProfile } = useProfile();
    const [activeNotification, setActiveNotification] = useState<Notification | null>(null);
    const [cooldown, setCooldown] = useState(0);

    const latestNotificationQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'notifications'),
            orderBy('createdAt', 'desc'),
            limit(1)
        );
    }, [firestore]);

    const { data: latestNotifications } = useCollection<Notification>(latestNotificationQuery);

    useEffect(() => {
        if (latestNotifications && latestNotifications.length > 0) {
            const notification = latestNotifications[0];
            if (!userProfile) return;

            const userIsTargeted = 
                notification.targetAudience === 'all' ||
                (notification.targetAudience === 'staff' && ['Admin', 'SuperAdmin', 'Assistant'].includes(userProfile.role)) ||
                (notification.targetAudience === 'premium' && (userProfile?.hasPurchased || false));
            
            if (userIsTargeted) {
                const readStatus = localStorage.getItem(`notification_read_${notification.id}`);
                if (!readStatus) {
                    setActiveNotification(notification);
                    setCooldown(COOLDOWN_SECONDS);
                }
            }
        }
    }, [latestNotifications, userProfile]);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => {
                setCooldown(prev => prev - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleDismiss = () => {
        if (activeNotification) {
            localStorage.setItem(`notification_read_${activeNotification.id}`, 'true');
            setActiveNotification(null);
        }
    };

    if (!activeNotification) {
        return null;
    }

    return (
        <Dialog open={!!activeNotification} onOpenChange={(open) => !open && handleDismiss()}>
            <DialogContent className="sm:max-w-2xl bg-card border-primary/50 shadow-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <Megaphone className="w-8 h-8 text-primary" />
                        <DialogTitle className="text-2xl">Platform Announcement</DialogTitle>
                    </div>
                </DialogHeader>
                <div className="prose prose-invert prose-sm max-w-none my-4">
                     <ReactMarkdown>{activeNotification.message}</ReactMarkdown>
                </div>
                <DialogFooter>
                    <Button 
                        onClick={handleDismiss} 
                        disabled={cooldown > 0}
                        className="w-full"
                    >
                        {cooldown > 0 ? `I have read (${cooldown}s)` : 'I have read'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
