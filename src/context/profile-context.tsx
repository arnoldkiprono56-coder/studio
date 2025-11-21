
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

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [oneXBetId, setOneXBetId] = useState('');


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
    if (!isProfileLoading && userProfile) {
      // 1. Check for suspension first
      if (userProfile.isSuspended && pathname !== '/suspended' && !pathname.startsWith('/support')) {
        router.replace('/suspended');
        return;
      }
      
      const publicPaths = ['/company-agreement', '/assistant-onboarding', '/login', '/register', '/suspended'];
      const currentIsPublic = publicPaths.some(p => pathname === p);
      
      // 2. Check for Company Agreement
      if (!userProfile.companyAgreementAccepted && !currentIsPublic) {
          router.replace('/company-agreement');
          return;
      }

      // 3. Check for Assistant Onboarding
      const isAssistant = userProfile.role === 'Assistant';
      const hasAcceptedAssistantAgreement = userProfile.assistantAgreementAccepted === true;
      
      if (isAssistant && !hasAcceptedAssistantAgreement && pathname !== '/assistant-onboarding') {
          router.replace('/assistant-onboarding');
          return;
      }
    }
  }, [userProfile, isProfileLoading, pathname, router]);
  
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
    isProfileLoading: isUserLoading || isProfileLoading,
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

    