
'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Header } from '@/components/header';
import { BroadcastListener } from '@/components/BroadcastListener';
import { AdminWelcomeToast } from '@/components/admin-welcome-toast';

export default function AppLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <SidebarProvider>
            <div className="flex">
                <AppSidebar />
                <div className="flex-1 flex flex-col min-h-screen">
                    <Header />
                    <main className="flex-1 container py-8 flex flex-col">{children}</main>
                </div>
            </div>
            <BroadcastListener />
            <AdminWelcomeToast />
        </SidebarProvider>
    );
}
