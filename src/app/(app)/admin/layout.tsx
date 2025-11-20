
'use client';

import { ReactNode, useEffect } from 'react';
import { useProfile } from '@/context/profile-context';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/context/profile-context';


const allAdminTabs = [
  { value: 'dashboard', label: 'Dashboard', href: '/admin' },
  { value: 'user-lookup', label: 'User Lookup', href: '/admin/user-lookup' },
  { value: 'assistant', label: 'AI Assistant', href: '/admin/assistant' },
  { value: 'licenses', label: 'Licenses', href: '/admin/licenses' },
  { value: 'payments', label: 'Payments', href: '/admin/payments' },
  { value: 'pricing', label: 'Pricing', href: '/admin/pricing' },
  { value: 'games', label: 'Games', href: '/admin/games' },
  { value: 'broadcast', label: 'Send Broadcast', href: '/admin/broadcast' },
  { value: 'broadcasts', label: 'Broadcast Log', href: '/admin/broadcasts' },
  { value: 'settings', label: 'Settings', href: '/admin/settings' },
];

function AdminNav({ userProfile }: { userProfile: UserProfile | null }) {
    const pathname = usePathname();

    const getVisibleTabs = () => {
        if (!userProfile) return [];
        if (userProfile.role === 'Assistant') {
            return allAdminTabs.filter(tab => 
                ['dashboard', 'user-lookup', 'assistant', 'licenses', 'payments', 'support'].includes(tab.value)
            );
        }
        return allAdminTabs;
    }

    const adminTabs = getVisibleTabs();

    return (
        <div className="relative overflow-x-auto">
            <div className="flex gap-4 border-b">
                {adminTabs.map(tab => {
                    const isActive = pathname === tab.href;

                    if(tab.value === 'broadcast' && pathname.startsWith('/admin/broadcast')) return (
                       <Link href={tab.href} key={tab.value} className={cn(
                            "pb-3 px-1 border-b-2 text-sm font-medium whitespace-nowrap",
                            pathname === '/admin/broadcast'
                                ? "border-primary text-primary" 
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        )}>
                            {tab.label}
                        </Link>
                    )
                     if(tab.value === 'broadcasts' && pathname.startsWith('/admin/broadcast')) return (
                       <Link href={tab.href} key={tab.value} className={cn(
                            "pb-3 px-1 border-b-2 text-sm font-medium whitespace-nowrap",
                             pathname === '/admin/broadcasts'
                                ? "border-primary text-primary" 
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        )}>
                            {tab.label}
                        </Link>
                    )
                    
                    if(pathname.startsWith('/admin/broadcast') && (tab.value !== 'broadcast' && tab.value !== 'broadcasts')) return null;

                    return (
                        <Link href={tab.href} key={tab.value} className={cn(
                            "pb-3 px-1 border-b-2 text-sm font-medium whitespace-nowrap",
                            isActive
                                ? "border-primary text-primary" 
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        )}>
                            {tab.label}
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}


export default function AdminLayout({ children }: { children: ReactNode }) {
  const { userProfile, isProfileLoading } = useProfile();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isProfileLoading) {
      if (!userProfile) {
        router.replace('/login');
        return;
      }
      const isAdminOrSuperAdmin =
        userProfile.role === 'SuperAdmin' ||
        userProfile.role === 'Admin' ||
        userProfile.role === 'Assistant';
      if (!isAdminOrSuperAdmin) {
        router.replace('/dashboard');
      }
    }
  }, [userProfile, isProfileLoading, router]);

  const isAdminOrSuperAdmin =
    userProfile?.role === 'SuperAdmin' ||
    userProfile?.role === 'Admin' ||
    userProfile?.role === 'Assistant';
  
  if (isProfileLoading || !userProfile || !isAdminOrSuperAdmin) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-80" />
        </div>
        <div className="space-y-4">
            <Skeleton className="h-10 w-full max-w-sm" />
            <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  const showTabs = !pathname.startsWith('/admin/settings');


  return (
    <div className="space-y-6">
        <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Platform overview and management tools.</p>
        </div>
        {showTabs && <AdminNav userProfile={userProfile} />}
        <div className="mt-6">{children}</div>
    </div>
  );
}
