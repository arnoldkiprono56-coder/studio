'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, DocumentData, DocumentReference, setDoc, updateDoc } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  email: string | null;
  role: string;
  oneXBetId?: string;
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

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [oneXBetId, setOneXBetId] = useState('');


  const updateUserProfile = useCallback(async (data: Partial<UserProfile>) => {
    if (!userDocRef) {
      throw new Error("User document reference is not available.");
    }
    await updateDoc(userDocRef, data);
  }, [userDocRef]);
  

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
        console.error("Failed to save 1xBet ID:", error);
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
        <DialogContent className="sm:max-w-[425px]" style={{ background: 'linear-gradient(145deg, #1d6a9f, #0e3b5e)', color: 'white', borderColor: '#1d6a9f' }}>
          <DialogHeader>
            <DialogTitle>Enter Your 1xBet ID</DialogTitle>
            <DialogDescription className="text-blue-200">
              PredictPro works exclusively with 1xBet. Please enter your 1xBet Account ID to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="1xbet-id" className="text-right">
                Account ID
              </Label>
              <Input
                id="1xbet-id"
                value={oneXBetId}
                onChange={(e) => setOneXBetId(e.target.value)}
                className="col-span-3 bg-blue-900/50 border-blue-400 text-white placeholder:text-blue-300"
                placeholder="Your 1xBet numeric ID"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveOneXBetId} className="bg-blue-400 hover:bg-blue-500 text-black">Save ID</Button>
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
