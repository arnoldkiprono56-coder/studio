'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Megaphone, Loader2 } from 'lucide-react';
import { useProfile } from '@/context/profile-context';

type Audience = 'all' | 'premium' | 'staff';

export function BroadcastForm() {
    const firestore = useFirestore();
    const { userProfile } = useProfile();
    const { toast } = useToast();
    const [message, setMessage] = useState('');
    const [audience, setAudience] = useState<Audience>('all');
    const [isSending, setIsSending] = useState(false);

    const handleSendBroadcast = async () => {
        if (!firestore || !userProfile) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not send broadcast. User not authenticated.' });
            return;
        }
        if (!message.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Broadcast message cannot be empty.' });
            return;
        }

        setIsSending(true);

        try {
            await addDoc(collection(firestore, 'notifications'), {
                message,
                targetAudience: audience,
                senderId: userProfile.id,
                senderEmail: userProfile.email,
                createdAt: serverTimestamp(),
            });

            toast({
                title: 'Broadcast Sent!',
                description: `Your message has been sent to the '${audience}' group.`,
            });
            setMessage('');

        } catch (error: any) {
            console.error('Broadcast error:', error);
            toast({
                variant: 'destructive',
                title: 'Broadcast Failed',
                description: error.message || 'An unexpected error occurred.',
            });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Megaphone className="h-6 w-6 text-muted-foreground" />
                    <CardTitle>Send a Broadcast</CardTitle>
                </div>
                <CardDescription>
                    Send a message to a selected group of users. This will appear as a notification on their dashboard.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-2 col-span-1">
                        <Label htmlFor="audience">Target Audience</Label>
                        <Select value={audience} onValueChange={(value: Audience) => setAudience(value)}>
                            <SelectTrigger id="audience">
                                <SelectValue placeholder="Select an audience..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Users</SelectItem>
                                <SelectItem value="premium">Premium Users</SelectItem>
                                <SelectItem value="staff">Admins & Assistants</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="message">Broadcast Message</Label>
                    <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message here... It supports markdown."
                        className="min-h-[150px]"
                    />
                </div>

                <div className="flex justify-end">
                    <Button onClick={handleSendBroadcast} disabled={isSending}>
                        {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSending ? 'Sending...' : 'Send Broadcast'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
