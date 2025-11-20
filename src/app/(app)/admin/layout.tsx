
'use client';

import { ReactNode, useEffect } from 'react';
import { useProfile } from '@/context/profile-context';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { userProfile, isProfileLoading } = useProfile();
  const router = useRouter();

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
            <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="space-y-0.5">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Admin Dashboard</h1>
            <p className="text-muted-foreground">Platform overview and management tools for PredictPro.</p>
        </div>
        <div className="mt-6">{children}</div>
    </div>
  );
}
