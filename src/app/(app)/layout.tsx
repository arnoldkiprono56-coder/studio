
'use client';

import { Header } from '@/components/header';
import { BroadcastListener } from '@/components/BroadcastListener';
import { AdminWelcomeToast } from '@/components/admin-welcome-toast';
import { PremiumWrapper } from '@/components/premium-wrapper';
import { PremiumActivationListener } from '@/components/premium-activation-listener';
import { LocationBlocker } from '@/components/LocationBlocker';


export default function AppLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <PremiumWrapper>
            <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 container py-8 flex flex-col">{children}</main>
                <BroadcastListener />
                <AdminWelcomeToast />
                <PremiumActivationListener />
                <LocationBlocker />
            </div>
        </PremiumWrapper>
    );
}

    
