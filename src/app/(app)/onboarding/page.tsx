'use client';

import { useProfile } from "@/context/profile-context";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function OnboardingPage() {
    const { openOneXBetDialog } = useProfile();

    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold tracking-tight mb-4">Welcome to PredictPro!</h1>
                <p className="text-muted-foreground mb-8">
                    Karibu! Our AI-powered prediction tools are fine-tuned for the 1xBet platform.
                    To ensure accuracy and maintain system integrity, we require your official 1xBet User ID.
                    Please provide it to continue.
                </p>
            </div>
            <Button 
                size="lg" 
                className="fixed bottom-8 left-8 bg-red-600 hover:bg-red-700 text-white shadow-2xl"
                onClick={openOneXBetDialog}
            >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
        </div>
    );
}
