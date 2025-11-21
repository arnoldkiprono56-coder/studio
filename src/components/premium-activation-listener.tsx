
'use client';

import { useState, useEffect } from 'react';
import { useProfile } from '@/context/profile-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';


const benefitsByTier: Record<string, string[]> = {
    standard: [
        "Enhanced AI Accuracy",
        "Access to All Game Predictions",
        "Priority Support",
    ],
    pro: [
        "Everything in Standard",
        "Highest AI Accuracy",
        "Early Access to New Features",
        "Deeper Match Analysis",
    ],
    enterprise: [
        "Everything in Pro",
        "Dedicated AI Model Training",
        "24/7 Direct Analyst Support",
        "Custom Feature Requests",
    ],
};


export function PremiumActivationListener() {
    const { userProfile } = useProfile();
    const [previousPremiumStatus, setPreviousPremiumStatus] = useState(userProfile?.premiumStatus);
    const [showActivationDialog, setShowActivationDialog] = useState(false);
    const [activatedTier, setActivatedTier] = useState<string | null>(null);

    useEffect(() => {
        if (userProfile && userProfile.premiumStatus && userProfile.premiumStatus !== previousPremiumStatus) {
            // Premium status has been added or changed
            setActivatedTier(userProfile.premiumStatus);
            setShowActivationDialog(true);
            setPreviousPremiumStatus(userProfile.premiumStatus);
        }
         // Used to set the initial state without triggering the dialog on first load
        if (userProfile && !previousPremiumStatus && userProfile.premiumStatus) {
            setPreviousPremiumStatus(userProfile.premiumStatus);
        }

    }, [userProfile, previousPremiumStatus]);

    const benefits = activatedTier ? benefitsByTier[activatedTier] : [];

    return (
        <Dialog open={showActivationDialog} onOpenChange={setShowActivationDialog}>
            <DialogContent className="sm:max-w-md bg-gradient-to-tr from-background to-card/50 border-primary/50 shadow-2xl shadow-primary/20">
                 <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-glow-line" />
                <DialogHeader>
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary shadow-lg shadow-primary/30">
                            <Star className="w-8 h-8 text-primary animate-pulse-slow" />
                        </div>
                    </div>
                    <DialogTitle className="text-center text-2xl font-bold">Welcome to Premium!</DialogTitle>
                    <DialogDescription className="text-center">
                        Your account has been upgraded to the <span className="font-bold capitalize text-primary">{activatedTier}</span> tier.
                    </DialogDescription>
                </DialogHeader>
                <div className="my-4">
                    <p className="font-semibold mb-3">You now have access to these exclusive benefits:</p>
                    <ul className="space-y-2">
                        {benefits.map((benefit, index) => (
                            <li key={index} className="flex items-start gap-2">
                                <Zap className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                                <span>{benefit}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <DialogFooter>
                    <Button onClick={() => setShowActivationDialog(false)} className="w-full">
                        <Check className="mr-2 h-4 w-4" />
                        Got it!
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

    