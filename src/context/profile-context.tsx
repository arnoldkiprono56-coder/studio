
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase, FirestorePermissionError, errorEmitter } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/icons';

interface UserProfile {
  id: string;
  email: string | null;
  role: string;
  oneXBetId?: string;
  isSuspended?: boolean;
  assistantAgreementAccepted?: boolean;
  companyAgreementAccepted?: boolean;
  photoURL?: string;
  premiumStatus?: 'standard' | 'pro' | 'enterprise';
  [key: string]: any;
}

interface ProfileContextType {
  userProfile: UserProfile | null;
  isProfileLoading: boolean;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  openOneXBetDialog: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileHookLoading } = useDoc<UserProfile>(userDocRef);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [oneXBetId, setOneXBetId] = useState('');

  // This is the consolidated loading state. It's true if we're waiting for auth OR the profile.
  const isProfileLoading = isUserLoading || (!!user && isProfileHookLoading);
  
  // A new state to handle the specific case where auth is done but profile isn't, to avoid premature redirects.
  const [isVerifyingProfile, setIsVerifyingProfile] = useState(false);


  const updateUserProfile = useCallback(async (data: Partial<UserProfile>) => {
    if (!userDocRef || !firestore || !user) {
      throw new Error("User document reference or firestore is not available.");
    }
    
    try {
        await updateDoc(userDocRef, data);
    } catch (error) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'update',
            requestResourceData: data,
        }));
        // Re-throw or handle as needed, for now we let the emitter handle it
        throw error;
    }

  }, [userDocRef, firestore, user]);

  useEffect(() => {
    const isAuthPage = ['/login', '/register', '/reset-password', '/terms', '/verify-otp'].includes(pathname);

    // While Firebase is checking auth state, do nothing.
    if (isUserLoading) {
      return;
    }

    // If there is no authenticated user at all...
    if (!user) {
        // And we are not on a public authentication page, redirect to login.
        if (!isAuthPage) {
            router.replace('/login');
        }
        // If we are on an auth page, allow it.
        return;
    }

    // If we have an authenticated user, but are still waiting for their profile from Firestore...
    if (user && !userProfile && isProfileHookLoading) {
      // Set a "verifying" state. This prevents the next block from running prematurely.
      setIsVerifyingProfile(true);
      return; 
    }
    
    // If we were verifying but now the profile has loaded, stop verifying.
    if(isVerifyingProfile && userProfile) {
        setIsVerifyingProfile(false);
    }

    // If we have an authenticated user, but their profile document doesn't exist in Firestore...
    if (user && !userProfile && !isProfileHookLoading) {
        // This is a critical error state. The user exists in Auth but not in the database.
        // This should not happen in normal operation (e.g., after registration).
        // To be safe, we log the error and log them out.
        if (!isAuthPage) {
            console.error("User authenticated but profile not found. Logging out.");
            router.replace('/login');
        }
        return;
    }
    
    // If we have both user and userProfile, proceed with app logic.
    if (user && userProfile) {
        // 1. Check for suspension first
        if (userProfile.isSuspended && pathname !== '/suspended' && !pathname.startsWith('/support')) {
          router.replace('/suspended');
          return;
        }
        
        // Define public paths that don't require further checks
        const publicPaths = ['/company-agreement', '/assistant-onboarding', '/suspended'];
        const isPublicAgreementPage = publicPaths.some(p => pathname.startsWith(p));
        
        if (isPublicAgreementPage) return;

        // 2. Check for Company Agreement
        if (!userProfile.companyAgreementAccepted) {
            router.replace('/company-agreement');
            return;
        }

        // 3. Check for Assistant Onboarding
        const isAssistant = userProfile.role === 'Assistant';
        const hasAcceptedAssistantAgreement = userProfile.assistantAgreementAccepted === true;
        
        if (isAssistant && !hasAcceptedAssistantAgreement) {
            router.replace('/assistant-onboarding');
            return;
        }
    }

  }, [user, userProfile, isUserLoading, isProfileHookLoading, pathname, router, isVerifyingProfile]);
  
  useEffect(() => {
    if(userProfile?.oneXBetId) {
        setOneXBetId(userProfile.oneXBetId);
    }
  }, [userProfile?.oneXBetId]);


  const handleSaveOneXBetId = async () => {
    if (!oneXBetId) {
        toast({
            variant: "destructive",
            title: "Validation Error",
            description: "Please enter your 1xBet ID.",
        });
        return;
    }
    try {
        await updateUserProfile({ oneXBetId });
        toast({
            title: "Success!",
            description: "Your 1xBet ID has been saved.",
        });
        setIsDialogOpen(false);
    } catch (error) {
        // The updateUserProfile function will now handle emitting the error.
        // We can still show a generic toast here if we want.
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not save your 1xBet ID. Please try again.",
        });
    }
  };


  const value = {
    userProfile,
    isProfileLoading: isProfileLoading || isVerifyingProfile, // The app is "loading" if we are verifying the profile
    updateUserProfile,
    openOneXBetDialog: () => setIsDialogOpen(true),
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader className="items-center text-center">
            <Logo className="w-12 h-12 text-primary" />
            <DialogTitle>Enter Your 1xBet ID</DialogTitle>
            <DialogDescription>
              PredictPro works exclusively with 1xBet. Please enter your 1xBet Account ID to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
              <Label htmlFor="1xbet-id">
                1xBet Account ID
              </Label>
              <Input
                id="1xbet-id"
                value={oneXBetId}
                onChange={(e) => setOneXBetId(e.target.value)}
                placeholder="Your 1xBet numeric ID"
              />
          </div>
          <DialogFooter>
            <Button onClick={handleSaveOneXBetId} className="w-full">Save and Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
