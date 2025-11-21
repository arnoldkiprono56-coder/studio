'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, ChevronLeft, Bot, User, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { generateSupportResponse } from '@/ai/flows/generate-support-response';
import { useProfile } from '@/context/profile-context';
import { useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { addDoc, collection, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';

type Message = {
    id: string;
    text: string;
    sender: 'user' | 'model';
    isUser: boolean;
    chatType: string;
    createdAt: any;
};

function ChatComponent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const chatType = Array.isArray(params.chatType) ? params.chatType[0] : params.chatType;
    const initialMessage = searchParams.get('message');

    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { userProfile } = useProfile();
    const firestore = useFirestore();

    const [input, setInput] = useState('');

     const messagesCollection = useMemoFirebase(() => {
        if (!firestore || !userProfile?.id) return null;
        return collection(firestore, 'users', userProfile.id, 'support_messages');
    }, [firestore, userProfile?.id]);

    const messagesQuery = useMemoFirebase(() => {
        if (!messagesCollection) return null;
        return query(messagesCollection, where('chatType', '==', chatType), orderBy('createdAt', 'asc'));
    }, [messagesCollection, chatType]);

    const { data: messages, isLoading: messagesLoading } = useCollection<Message>(messagesQuery);
    
    useEffect(() => {
        if(initialMessage) {
            setInput(initialMessage);
        }
    }, [initialMessage]);

    const getChatTitle = () => {
        if (!chatType) return 'Support Chat';
        return chatType.charAt(0).toUpperCase() + chatType.slice(1).replace('-', ' ') + ' Chat';
    }

    const scrollToBottom = () => {
        setTimeout(() => {
            const scrollViewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollViewport) {
                scrollViewport.scrollTo({ top: scrollViewport.scrollHeight, behavior: 'smooth' });
            }
        }, 100);
    };

    const handleSendMessage = async () => {
        if (input.trim() && !isLoading && messagesCollection && userProfile?.id) {
            const currentInput = input;
            const userMessageData = {
                text: currentInput,
                sender: 'user' as const,
                isUser: true,
                chatType,
                createdAt: serverTimestamp(),
            };
            
            setInput('');
            setIsLoading(true);
            scrollToBottom();
            
            // Add user message to Firestore
            await addDoc(messagesCollection, userMessageData);
            
            const conversationHistory = (messages || []).map(m => ({
                isUser: m.sender === 'user',
                text: m.text
            }));

            // Add the new user message to the history for the AI
            conversationHistory.push({
                isUser: true,
                text: currentInput,
            });
            
            try {
                const result = await generateSupportResponse({
                    message: currentInput,
                    chatType: chatType,
                    history: conversationHistory,
                    adminId: userProfile.id,
                });
                
                const aiMessageData = {
                    text: result.response,
                    sender: 'model' as const,
                    isUser: false,
                    chatType,
                    createdAt: serverTimestamp(),
                };
                await addDoc(messagesCollection, aiMessageData);

            } catch (error) {
                console.error("Failed to get AI response:", error);
                const errorMessageData = {
                    text: "Sorry, I'm having trouble connecting. Please try again later.",
                    sender: 'model' as const,
                    isUser: false,
                    chatType,
                    createdAt: serverTimestamp(),
                };
                await addDoc(messagesCollection, errorMessageData);
            } finally {
                setIsLoading(false);
                scrollToBottom();
            }
        }
    };
    
    useEffect(() => {
        scrollToBottom();
    }, [messages]);


    return (
        <div className="flex flex-col flex-1 h-full max-h-[calc(100vh-14rem)]">
            <div className="flex items-center mb-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/support">
                        <ChevronLeft className="h-6 w-6" />
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold tracking-tight ml-2">{getChatTitle()}</h1>
            </div>
            <Card className="flex-1 flex flex-col">
                <CardContent className="flex-1 p-0">
                    <ScrollArea className="h-full p-6" ref={scrollAreaRef}>
                        <div className="space-y-6">
                            {(messages || []).map((message) => (
                                <div key={message.id} className={cn(
                                    "flex items-start gap-3 w-full",
                                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                                )}>
                                     {message.sender === 'model' && (
                                        <Avatar className="h-8 w-8 border flex-shrink-0">
                                            <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                                        </Avatar>
                                     )}
                                    <div className={cn(
                                        "rounded-lg px-4 py-2 max-w-[80%] whitespace-pre-wrap",
                                        message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                    )}>
                                        <p className="text-sm">{message.text}</p>
                                    </div>
                                    {message.sender === 'user' && (
                                        <Avatar className="h-8 w-8 border flex-shrink-0">
                                            <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                        </Avatar>
                                     )}
                                </div>
                            ))}
                             {isLoading && (
                                <div className="flex items-start gap-3 justify-start">
                                    <Avatar className="h-8 w-8 border">
                                        <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                                    </Avatar>
                                    <div className="rounded-lg px-4 py-2 bg-muted flex items-center">
                                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
                <CardFooter className="p-4 border-t">
                    <div className="flex w-full items-center space-x-2">
                        <Input
                            id="message"
                            placeholder="Type your message..."
                            className="flex-1"
                            autoComplete="off"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            disabled={isLoading}
                        />
                        <Button type="submit" size="icon" onClick={handleSendMessage} disabled={isLoading || !input.trim()}>
                            <Send className="h-4 w-4" />
                            <span className="sr-only">Send</span>
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}

export default function ChatPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ChatComponent />
        </Suspense>
    )
}

    