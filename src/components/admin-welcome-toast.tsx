
'use client';

import { useEffect } from 'react';
import { useProfile } from '@/context/profile-context';
import { useToast } from '@/hooks/use-toast';

// A unique key to track if the toast has been shown in the current session.
const SESSION_STORAGE_KEY = 'admin_welcome_toast_shown';

export function AdminWelcomeToast() {
  const { userProfile, isProfileLoading } = useProfile();
  const { toast } = useToast();

  useEffect(() => {
    // Wait for the profile to load.
    if (isProfileLoading || !userProfile) {
      return;
    }

    // Check if the user is an Admin or SuperAdmin.
    const isAdmin = userProfile.role === 'Admin' || userProfile.role === 'SuperAdmin';
    if (!isAdmin) {
      return;
    }

    // Check if the toast has already been shown in this session.
    const hasBeenShown = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (hasBeenShown) {
      return;
    }

    // Show the toast and mark it as shown for the session.
    toast({
      title: 'Admin Welcome',
      description: "Admins should meet in their screens. Assistants will not see this message.",
      duration: 8000, 
    });
    sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');

  }, [userProfile, isProfileLoading, toast]);

  // This component does not render anything itself.
  return null;
}
