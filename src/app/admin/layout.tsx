'use client';

import { ReactNode, useEffect } from 'react';
import { useProfile } from '@/context/profile-context';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const adminTabs = [
  { value: 'dashboard', label: 'Dashboard', href: '/admin' },
  { value: 'users', label: 'Users', href: '/admin/users' },
  { value: 'licenses', label: 'Licenses', href: '/admin/licenses' },
  { value: 'payments', label: 'Payments', href: '/admin/payments' },
  { value: 'pricing', label: 'Pricing', href: '/admin/pricing' },
  { value: 'games', label: 'Games', href: '/admin/games' },
  { value: 'settings', label: 'Settings', href: '/admin/settings' },
];

function AdminNav() {
    const pathname = usePathname();
    
    // Find the most specific match first
    const activeTab = [...adminTabs].reverse().find(tab => pathname.startsWith(tab.href))?.value || 'dashboard';

    return (
        <Tabs value={activeTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 h-auto sm:w-auto sm:inline-flex sm:grid-cols-none">
                {adminTabs.map(tab => (
                     <TabsTrigger value={tab.value} key={tab.value} asChild>
                        <Link href={tab.href}>{tab.label}</Link>
                    </TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
    )
}


export default function AdminLayout({ children }: { children: ReactNode }) {
  const { userProfile, isProfileLoading } = useProfile();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isProfileLoading && userProfile) {
      const isAdminOrSuperAdmin =
        userProfile.role === 'SuperAdmin' ||
        userProfile.role === 'Admin' ||
        userProfile.role === 'Assistant';
      if (!isAdminOrSuperAdmin) {
        router.replace('/dashboard');
      }
    }
     if (!isProfileLoading && !userProfile) {
        router.replace('/login');
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

  // Hide tabs on settings page or its children
  const showTabs = !pathname.startsWith('/admin/settings');


  return (
    <div className="space-y-6">
        <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Platform overview and management tools.</p>
        </div>
        {showTabs && <AdminNav />}
        {children}
    </div>
  );
}
