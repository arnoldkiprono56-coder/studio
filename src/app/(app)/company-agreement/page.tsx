
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProfile } from '@/context/profile-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, X } from 'lucide-react';

export default function CompanyAgreementPage() {
    const router = useRouter();
    const auth = useAuth();
    const { userProfile, updateUserProfile, isProfileLoading } = useProfile();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleAgree = async () => {
        setIsProcessing(true);
        try {
            await updateUserProfile({ companyAgreementAccepted: true });
            toast({
                title: 'Agreement Accepted',
                description: 'Thank you for accepting the company policies. Welcome to PredictPro!',
            });
            router.push('/dashboard');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDecline = async () => {
        setIsProcessing(true);
        toast({
            variant: 'destructive',
            title: 'Agreement Declined',
            description: 'You must accept the agreement to use the platform. You will now be logged out.',
        });
        if (auth) {
            await signOut(auth);
        }
        router.push('/login');
    };

    const isLoading = isProfileLoading || isProcessing;

    return (
        <div className="flex justify-center items-center flex-1 py-8">
            <Card className="w-full max-w-4xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl md:text-3xl">📜 PredictPro Platform Agreement</CardTitle>
                    <CardDescription>
                        Please review the official terms, roles, and code of conduct for using the PredictPro platform.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[50vh] pr-6">
                        <div className="space-y-6 prose prose-sm prose-invert max-w-none">
                            
                            <h2 className="font-bold text-lg">1. General Code of Conduct</h2>
                            <p>All users of PredictPro are required to maintain a respectful and professional environment. By using this platform, you agree not to:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Engage in harassment, fraudulent activities, or any form of abuse towards other users or staff.</li>
                                <li>Attempt to exploit, reverse-engineer, or disrupt the platform's services or AI models.</li>
                                <li>Share your account credentials or allow unauthorized access to the platform.</li>
                                <li>Misrepresent your identity or create multiple accounts to bypass system rules.</li>
                            </ul>

                            <h2 className="font-bold text-lg">2. Definition of Roles & Responsibilities</h2>
                            <p>Access to features is determined by your assigned role. All roles are subject to monitoring and review by SuperAdmins.</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><strong>User:</strong> The standard role for all registered members. Users can purchase licenses, generate predictions, and access general support.</li>
                                <li><strong>Assistant:</strong> A staff role with limited administrative permissions. Assistants are responsible for customer support, payment verification, and upholding community standards. They operate under the supervision of Admins.</li>
                                <li><strong>Admin:</strong> A senior staff role with broad platform management capabilities, including user management, content control, and system configuration. Admins ensure the platform operates smoothly and securely.</li>
                                <li><strong>SuperAdmin:</strong> The highest level of authority. SuperAdmins have complete control over the platform, including role assignments, security policies, and financial oversight.</li>
                            </ul>

                            <h2 className="font-bold text-lg">3. Platform Integrity & AI Usage</h2>
                            <p>Our predictions are for informational purposes and are not guaranteed. You acknowledge that:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Claiming "guaranteed wins" or "fixed matches" is strictly forbidden and grounds for immediate suspension.</li>
                                <li>The AI models and prediction data are proprietary to PredictPro. Any attempt to scrape, copy, or resell this data is a violation of these terms.</li>
                                <li>Feedback provided on predictions may be used to retrain and improve our AI models.</li>
                            </ul>

                            <h2 className="font-bold text-lg">4. Data Privacy and Security</h2>
                            <p>We are committed to protecting your data. Your activities on the platform, including logins, prediction requests, and administrative actions, are logged for security and auditing purposes. Staff members (Assistants, Admins, SuperAdmins) have access to user data only as required to perform their duties. Misuse of this access is a serious offense.</p>

                            <h2 className="font-bold text-lg">5. Agreement Actions</h2>
                            <p>Your choice below is final for this session.</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><strong>If you AGREE:</strong> The system will record your acceptance, and you will be granted access to the platform based on your assigned role.</li>
                                <li><strong>If you DECLINE:</strong> You will not be able to access the platform. The system will end your session and log you out immediately.</li>
                            </ul>
                        </div>
                    </ScrollArea>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 border-t pt-6">
                    <p className="text-center font-semibold">By clicking "AGREE," you acknowledge you have read, understood, and consented to be bound by these terms.</p>
                    <div className="flex flex-col sm:flex-row gap-4 w-full">
                        <Button
                            size="lg"
                            className="w-full"
                            onClick={handleAgree}
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : <Check />}
                            AGREE &amp; Continue
                        </Button>
                        <Button
                            size="lg"
                            variant="destructive"
                            className="w-full"
                            onClick={handleDecline}
                            disabled={isLoading}
                        >
                             {isLoading ? <Loader2 className="animate-spin" /> : <X />}
                            DECLINE &amp; Log Out
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}

    