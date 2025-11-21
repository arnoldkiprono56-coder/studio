
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProfile } from '@/context/profile-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, X } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';

export default function AssistantOnboardingPage() {
    const router = useRouter();
    const { userProfile, updateUserProfile, isProfileLoading } = useProfile();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [paymentNumber, setPaymentNumber] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleAccept = async () => {
        if (!userProfile || !firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'User profile not loaded. Please wait and try again.' });
            return;
        }
        setIsProcessing(true);

        updateUserProfile({
            assistantPaymentNumber: paymentNumber,
            assistantAgreementAccepted: true,
        }).then(() => {
            // Create an audit log for this action
            const auditLogData = {
                userId: userProfile.id,
                action: 'assistant_onboarding_accepted',
                details: `User ${userProfile.email} accepted the assistant agreement.`,
                timestamp: serverTimestamp(),
                ipAddress: 'not_collected',
            };
            
            const auditLogsCollection = collection(firestore, 'auditlogs');
            addDoc(auditLogsCollection, auditLogData)
                .catch(error => {
                        errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: auditLogsCollection.path,
                        operation: 'create',
                        requestResourceData: auditLogData
                    }));
                });

            toast({
                title: 'Welcome, Assistant!',
                description: 'Your account has been upgraded. Redirecting you to the dashboard.',
            });
            router.push('/admin');
        }).finally(() => {
            // This will run whether the update succeeds or fails.
            // If it fails, the global error handler will catch it, and we still want to stop the loading spinner.
            setIsProcessing(false);
        });
    };

    const handleDecline = () => {
        if (!userProfile) {
            toast({ variant: 'destructive', title: 'Error', description: 'User profile not loaded. Please wait and try again.' });
            return;
        };
        setIsProcessing(true);
         // Revert role to 'User'
        updateUserProfile({ role: 'User' })
            .then(() => {
                router.push('/dashboard');
            })
            .finally(() => {
                setIsProcessing(false);
            });
    };
    
    const isLoading = isProfileLoading || isProcessing;

    return (
        <div className="flex justify-center items-center flex-1 py-8">
            <Card className="w-full max-w-4xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl md:text-3xl">📘 Welcome to PredictPro — Assistant Onboarding</CardTitle>
                    <CardDescription>
                        Before you continue, please review the following rules, policies, responsibilities, and conditions for becoming an official PredictPro Assistant.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[50vh] pr-6">
                        <div className="space-y-6 prose prose-sm prose-invert max-w-none">
                            
                            <h2 className="font-bold text-lg">1. Core Responsibilities of an Assistant</h2>
                            <p>As a PredictPro Assistant, you are a trusted member of the staff team. Your primary duties are to ensure a smooth and fair user experience. This includes:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><strong>Customer Support:</strong> Responding to user queries in the support channels promptly and professionally.</li>
                                <li><strong>License Activation:</strong> Manually activating licenses for users after verifying their payment messages. This is a high-trust role.</li>
                                <li><strong>Guidance:</strong> Helping users understand how to use the platform, from generating predictions to understanding game rules.</li>
                                <li><strong>Monitoring:</strong> Reporting suspicious activity, rule violations, or system bugs to Admins immediately.</li>
                            </ul>

                            <h2 className="font-bold text-lg">2. Code of Conduct & Professionalism</h2>
                            <p>Your actions reflect on the entire platform. You are required to:</p>
                            <h3 className="font-semibold">Do:</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Act with integrity, honesty, and respect in all interactions.</li>
                                <li>Protect user privacy at all times. Do not share user information (email, user ID, etc.) with anyone outside the admin team.</li>
                                <li>Follow instructions from Admins and SuperAdmins without question.</li>
                                <li>Use the "AI Assistant" tool for help with platform management tasks.</li>
                            </ul>
                            <h3 className="font-semibold">Do NOT:</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Harass, threaten, or abuse any user or staff member.</li>
                                <li>Abuse your powers. Do not activate licenses for friends or for yourself without valid payment. This will be tracked.</li>
                                <li>Attempt to access parts of the system you are not authorized for (e.g., pricing controls, user role management).</li>
                                <li>Share internal system information, operational procedures, or admin chat logs.</li>
                            </ul>

                             <h2 className="font-bold text-lg">3. Payment Verification & License Activation</h2>
                             <p>One of your most critical tasks is activating user licenses. You agree to:</p>
                             <ul className="list-disc pl-5 space-y-1">
                                <li>Follow the official company guidelines for verifying payment messages (e.g., checking transaction codes, amounts, and dates).</li>
                                <li>Approve or reject activation requests honestly and based on the evidence provided.</li>
                                <li>NEVER request additional money or direct payments from users to your personal accounts. All payments go to the official company number only.</li>
                                <li>Use the "Activate License" button in the "User Lookup" or "Staff Management" sections to grant licenses.</li>
                            </ul>
                            <p>Remember: All license activations are logged and audited. Fraudulent activations will lead to immediate role termination and a permanent ban.</p>

                             <h2 className="font-bold text-lg">4. Assistant Earnings & Payment</h2>
                             <p>If PredictPro offers compensation for the Assistant role, it will be issued exclusively by Admins or SuperAdmins according to an official schedule.</p>
                             <ul className="list-disc pl-5 space-y-1">
                                <li>To receive salary (if applicable), you must register an official mobile payment number below.</li>
                                <li>This number must belong to you. Using someone else’s number or impersonating another individual is strictly forbidden.</li>
                                <li>This number will be stored securely and used only for the purpose of sending your salary. It will not be shared with other users.</li>
                            </ul>
                            <div className="space-y-2 max-w-sm">
                                <Label htmlFor="payment-number">Payment Number (e.g., M-Pesa)</Label>
                                <Input 
                                    id="payment-number" 
                                    placeholder="Your official payment number"
                                    value={paymentNumber}
                                    onChange={(e) => setPaymentNumber(e.target.value)}
                                />
                            </div>
                            <p className="text-xs italic">(This is only a template. If you are a minor, you must consult a parent or guardian before using or submitting any financial details.)</p>

                            <h2 className="font-bold text-lg">5. System Access & Monitoring</h2>
                            <p>As an Assistant, you will have access to specific admin tools:</p>
                             <ul className="list-disc pl-5 space-y-1">
                                <li><strong>Admin Dashboard:</strong> A limited view of platform statistics.</li>
                                <li><strong>User Lookup:</strong> To find users and view their licenses and activity for support purposes.</li>
                                <li><strong>AI Assistant:</strong> A powerful tool to help you manage the platform.</li>
                                <li><strong>Licenses & Support:</strong> To view and manage user licenses and support tickets.</li>
                             </ul>
                             <p>You agree that your activity on these tools will be monitored by Admins to ensure security and proper use. Any attempt to bypass your permissions will be logged and will result in disciplinary action.</p>

                             <h2 className="font-bold text-lg">6. Agreement Actions</h2>
                             <p>If you tap <strong>ACCEPT</strong>, you confirm you have read and agree to all terms. The system will upgrade your account to "Assistant" and grant you access to the staff dashboard.</p>
                             <p>If you tap <strong>DECLINE</strong>, your role will be reverted to "User," and you will be returned to the standard user dashboard.</p>
                        </div>
                    </ScrollArea>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 border-t pt-6">
                    <p className="text-center font-semibold">By continuing, you confirm that you have read and understood all rules and conditions.</p>
                    <div className="flex flex-col sm:flex-row gap-4 w-full">
                        <Button
                            size="lg"
                            className="w-full"
                            onClick={handleAccept}
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : <Check />}
                            ACCEPT — Begin as PredictPro Assistant
                        </Button>
                        <Button
                            size="lg"
                            variant="destructive"
                            className="w-full"
                            onClick={handleDecline}
                            disabled={isLoading}
                        >
                             {isLoading ? <Loader2 className="animate-spin" /> : <X />}
                            DECLINE — Exit onboarding
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
