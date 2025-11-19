'use client';

import { ReactNode, useEffect } from 'react';
import { useProfile } from '@/context/profile-context';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';


const adminTabs = [
  { value: 'dashboard', label: 'Dashboard', href: '/admin' },
  { value: 'assistant', label: 'AI Assistant', href: '/admin/assistant' },
  { value: 'users', label: 'Users', href: '/admin/users' },
  { value: 'licenses', label: 'Licenses', href: '/admin/licenses' },
  { value: 'payments', label: 'Payments', href: '/admin/payments' },
  { value: 'pricing', label: 'Pricing', href: '/admin/pricing' },
  { value: 'games', label: 'Games', href: '/admin/games' },
  { value: 'broadcast', label: 'Send Broadcast', href: '/admin/broadcast' },
  { value: 'broadcasts', label: 'Broadcast Log', href: '/admin/broadcasts' },
  { value: 'settings', label: 'Settings', href: '/admin/settings' },
];

function AdminNav() {
    const pathname = usePathname();

    return (
        <div className="relative overflow-x-auto">
            <div className="flex gap-4 border-b">
                {adminTabs.map(tab => {
                    const isActive = pathname === tab.href || (pathname.startsWith(tab.href) && tab.href !== '/admin' && !pathname.startsWith('/admin/broadcasts'));
                    
                    if(tab.href === '/admin/broadcast' && pathname === '/admin/broadcasts') return null;
                    if(tab.href === '/admin/broadcasts' && pathname === '/admin/broadcast') return null;


                    return (
                        <Link href={tab.href} key={tab.value} className={cn(
                            "pb-3 px-1 border-b-2 text-sm font-medium whitespace-nowrap",
                            (isActive || pathname === tab.href)
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
        {showTabs && <AdminNav />}
        <div className="mt-6">{children}</div>
    </div>
  );
}
