
'use client';

import { useProfile } from '@/context/profile-context';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export function PremiumWrapper({ children }: { children: ReactNode }) {
    const { userProfile } = useProfile();
    const isPremium = !!userProfile?.premiumStatus;

    return (
        <div className={cn(
            'premium-wrapper',
            isPremium && 'is-premium',
        )}>
            {children}
            {isPremium && <div className="premium-glow-border" />}
        </div>
    );
}

    