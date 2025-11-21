
'use client';

import { ReactNode, useEffect } from 'react';
import { useProfile } from '@/context/profile-context';
import { useRouter, usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

const assistantAllowedPaths = [
    '/admin',
    '/admin/user-lookup',
    '/admin/assistant',
    '/admin/support',
];

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
        userProfile.role === 'SuperAdmin' || userProfile.role === 'Admin';
      
      const isAssistant = userProfile.role === 'Assistant';

      if (!isAdminOrSuperAdmin && !isAssistant) {
        router.replace('/dashboard');
        return;
      }

      if (isAssistant && !assistantAllowedPaths.includes(pathname)) {
          // Assistants can't access certain pages, so we redirect them.
          // In a real app, we might show a "Permission Denied" page.
          router.replace('/admin');
      }

    }
  }, [userProfile, isProfileLoading, router, pathname]);

  const hasAccess = 
    userProfile?.role === 'SuperAdmin' ||
    userProfile?.role === 'Admin' ||
    (userProfile?.role === 'Assistant' && assistantAllowedPaths.includes(pathname));

  if (isProfileLoading || !userProfile || !hasAccess) {
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
    <div className="w-full">
        {children}
    </div>
  );
}
