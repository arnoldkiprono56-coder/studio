
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
                            
                            <h2 className="font-bold text-lg">1. Purpose of the Assistant Role</h2>
                            <p>PredictPro Assistants help with:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Responding to users and offering guidance</li>
                                <li>Managing support tickets</li>
                                <li>Approving or reviewing payment confirmations (according to company rules)</li>
                                <li>Helping users understand how to use the platform</li>
                                <li>Working with the admin team to keep the system organized</li>
                                <li>Reporting any system issues, suspicious activity, or rule violations</li>
                            </ul>
                            <p>Assistants <strong>do NOT</strong> have full administrative control, and cannot modify system-wide settings unless authorized.</p>

                            <h2 className="font-bold text-lg">2. PredictPro Rules & Conduct Policy</h2>
                            <p>As an Assistant, you agree to:</p>
                            <h3 className="font-semibold">2.1 Professional Conduct</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Be respectful, helpful, and honest when communicating with users</li>
                                <li>Never harass, threaten, or misuse your authority</li>
                                <li>Protect user privacy</li>
                                <li>Follow instructions from Admins and Super Admins</li>
                            </ul>
                            <h3 className="font-semibold">2.2 System Integrity</h3>
                            <p>You must not:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Share internal information</li>
                                <li>Leak system data</li>
                                <li>Allow unauthorized users to access staff features</li>
                                <li>Modify or delete information without permission</li>
                                <li>Attempt to bypass security rules</li>
                            </ul>
                             <h3 className="font-semibold">2.3 Legal & Safety Requirements</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>You must follow all laws in your region</li>
                                <li>You must not use your position to perform scams or unauthorized transactions</li>
                                <li>Any suspicious activity must be reported immediately</li>
                            </ul>

                            <h2 className="font-bold text-lg">3. Payment Handling Responsibilities</h2>
                             <p>PredictPro Assistants <strong>review</strong> payment confirmations submitted by users, following the steps defined by Admins.</p>
                            <p>Assistants agree to:</p>
                             <ul className="list-disc pl-5 space-y-1">
                                <li>Verify payment evidence based on company guidelines</li>
                                <li>Approve or reject submissions honestly</li>
                                <li>Never request additional money from users</li>
                                <li>Never handle user banking information directly</li>
                                <li>Never promise results, guaranteed outcomes, or special privileges</li>
                            </ul>
                            <p>Assistants <strong>do not</strong> handle money themselves — only the verification process.</p>

                             <h2 className="font-bold text-lg">4. Assistant Earnings (Template Policy)</h2>
                             <p>If PredictPro offers earnings, they are issued <strong>only by Admins</strong> and according to internal schedules.</p>
                            <p>Assistants understand:</p>
                             <ul className="list-disc pl-5 space-y-1">
                                <li>Payments are processed only by official company staff</li>
                                <li>Assistants are paid only for approved work (according to the system’s rules)</li>
                                <li>Your payment method must be officially recorded in the system</li>
                                <li>You must not use someone else’s number or impersonate anyone</li>
                            </ul>
                            
                            <h2 className="font-bold text-lg">5. Registering a Payment Number</h2>
                            <p>To receive your salary (if provided), you must enter your official mobile payment number below:</p>
                            <div className="space-y-2 max-w-sm">
                                <Label htmlFor="payment-number">Payment Number (e.g., M-Pesa)</Label>
                                <Input 
                                    id="payment-number" 
                                    placeholder="Your payment number"
                                    value={paymentNumber}
                                    onChange={(e) => setPaymentNumber(e.target.value)}
                                />
                            </div>
                             <p>By entering your number, you confirm:</p>
                             <ul className="list-disc pl-5 space-y-1">
                                <li>It belongs to you</li>
                                <li>It is used only for receiving salary</li>
                                <li>It will not be shared with users</li>
                                <li>It will be protected by the system</li>
                            </ul>
                            <p className="text-xs italic">(This is only a template. If you are a minor, you must consult a parent or guardian before using or submitting any financial details.)</p>

                            <h2 className="font-bold text-lg">6. Privacy & Data Protection</h2>
                            <p>You agree that:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Your staff account will be monitored for security</li>
                                <li>Your activity logs may be reviewed by Admins</li>
                                <li>Violations may cause restriction or removal of your role</li>
                            </ul>

                             <h2 className="font-bold text-lg">7. If You Accept</h2>
                            <p>If you tap <strong>ACCEPT</strong>, the system will automatically:</p>
                             <ul className="list-disc pl-5 space-y-1">
                                <li>Create or activate your Assistant account</li>
                                <li>Save your payment number (if provided)</li>
                                <li>Grant you Assistant-level permissions</li>
                                <li>Display your dashboard and tools</li>
                                <li>Allow Admins to monitor your progress</li>
                                <li>Notify the Admin team that you have joined</li>
                            </ul>

                             <h2 className="font-bold text-lg">8. If You Decline</h2>
                            <p>If you tap <strong>DECLINE</strong>, the system will:</p>
                             <ul className="list-disc pl-5 space-y-1">
                                <li>Cancel the onboarding process</li>
                                <li>Delete any entered information</li>
                                <li>Not activate any permissions</li>
                                <li>Return you to the main page</li>
                                <li>Notify Admins that you denied the agreement</li>
                            </ul>
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
