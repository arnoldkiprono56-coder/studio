'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase, FirestorePermissionError, errorEmitter } from '@/firebase';
import { doc, DocumentData, DocumentReference, setDoc, updateDoc, writeBatch, getDoc } from 'firebase/firestore';
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
  balance?: number;
  referredBy?: string;
  hasPurchased?: boolean;
  isSuspended?: boolean;
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
        const batch = writeBatch(firestore);
        batch.update(userDocRef, data);

        if (data.role === 'Admin' || data.role === 'SuperAdmin') {
            const adminRef = doc(firestore, 'admins', user.uid);
            batch.set(adminRef, { userId: user.uid, isAdmin: true });
        }
        
        await batch.commit();

    } catch (error) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'write',
            requestResourceData: data,
        }));
        // Re-throw or handle as needed, for now we let the emitter handle it
        throw error;
    }

  }, [userDocRef, firestore, user]);

  useEffect(() => {
    // Automatically elevate the specific user to SuperAdmin if they aren't already.
    const ensureSuperAdmin = async () => {
        if (userProfile && userProfile.email === 'shadowvybez001@gmail.com' && userProfile.role !== 'SuperAdmin' && firestore && user) {
            const adminRef = doc(firestore, 'admins', user.uid);
            const adminDoc = await getDoc(adminRef);

            if (userProfile.role !== 'SuperAdmin' || !adminDoc.exists()) {
                console.log("Attempting to elevate user to SuperAdmin...");
                try {
                    const batch = writeBatch(firestore);
                    const userRef = doc(firestore, 'users', user.uid);
                    
                    batch.update(userRef, { role: 'SuperAdmin' });
                    batch.set(adminRef, { userId: user.uid, isAdmin: true });
                    
                    await batch.commit();
                    console.log("Successfully elevated to SuperAdmin and created admin entry.");
                } catch (error) {
                    console.error("Failed to elevate user to SuperAdmin:", error);
                }
            }
        }
    };
    ensureSuperAdmin();
  }, [userProfile, firestore, user]);

  useEffect(() => {
    if (userProfile?.isSuspended && pathname !== '/suspended' && !pathname.startsWith('/support')) {
      router.replace('/suspended');
    }
  }, [userProfile, pathname, router]);
  
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
