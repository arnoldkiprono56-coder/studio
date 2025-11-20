'use client';

import { useState, useEffect, useRef } from 'react';
import {
  collection,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User, Loader2, ArrowLeft } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { generateSupportResponse } from '@/ai/flows/generate-support-response';
import ReactMarkdown from 'react-markdown';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { useProfile } from '@/context/profile-context';
import {
  useFirestore,
  useMemoFirebase,
  errorEmitter,
  FirestorePermissionError,
  useCollection,
} from '@/firebase';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'model';
  isUser: boolean;
  createdAt: any;
};

// Helper component to render table from Markdown
const MarkdownTable = ({ children }: { children: React.ReactNode }) => {
    const tableData = children?.toString().split('\n').map(row => row.split('|').map(cell => cell.trim())) || [];
    if (tableData.length < 2) return <>{children}</> // Not a table

    const headers = tableData[0];
    const rows = tableData.slice(2); // Skip header and separator

    return (
        <div className="my-4 border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        {headers.map((header, i) => <TableHead key={i}>{header}</TableHead>)}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((row, i) => (
                        <TableRow key={i}>
                            {row.map((cell, j) => {
                                const header = headers[j]?.toLowerCase();
                                if (header && (header.includes('amount') || header.includes('price'))) {
                                    return <TableCell key={j}>{formatCurrency(parseFloat(cell))}</TableCell>
                                }
                                return <TableCell key={j}>{cell}</TableCell>
                            })}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};


export default function AdminAssistantPage() {
    const { userProfile } = useProfile();
    const firestore = useFirestore();
    const chatType = 'manager'; // Hard-coded for the admin assistant
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [input, setInput] = useState('');

    const messagesCollection = useMemoFirebase(() => {
        if (!firestore || !userProfile?.id) return null;
        return collection(firestore, 'users', userProfile.id, 'admin_chat_messages');
    }, [firestore, userProfile?.id]);

    const messagesQuery = useMemoFirebase(() => {
        if (!messagesCollection) return null;
        return query(messagesCollection, orderBy('createdAt', 'asc'));
    }, [messagesCollection]);

    const { data: messages, isLoading: messagesLoading } = useCollection<Message>(messagesQuery);
    
    useEffect(() => {
        if (messages && messages.length === 0 && firestore && userProfile?.id) {
             const welcomeMessage = {
                text: `Welcome, Admin. I am your platform management AI.

You can ask me to perform tasks like:
- "Show me all available pre-verified credits."
- "Add a pre-verified credit for transaction ID SBB123ABCDE with amount 1500."
- "List all users who joined in the last 72 hours."

How can I help?`,
                sender: 'model',
                isUser: false,
                createdAt: serverTimestamp(),
            };
            addDoc(collection(firestore, 'users', userProfile.id, 'admin_chat_messages'), welcomeMessage);
        }
    }, [messages, firestore, userProfile?.id]);


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
                createdAt: serverTimestamp(),
            };
            
            setInput('');
            setIsLoading(true);
            scrollToBottom();

            await addDoc(messagesCollection, userMessageData);
            
            const conversationHistory = (messages || []).map(m => ({
                isUser: m.sender === 'user',
                text: m.text
            }));
            
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
                    createdAt: serverTimestamp(),
                };
                await addDoc(messagesCollection, aiMessageData);

            } catch (error) {
                console.error("Failed to get AI response:", error);
                const errorMessageData = {
                    text: "Sorry, I'm having trouble connecting. Please try again later.",
                    sender: 'model' as const,
                    isUser: false,
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
        <div className="flex flex-col flex-1 h-full max-h-[calc(100vh-8rem)]">
             <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/admin">
                        <ArrowLeft />
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">AI Assistant</h1>
            </div>
            <Card className="flex-1 flex flex-col">
                 <CardHeader>
                    <CardDescription>
                        A conversational AI to help you manage the platform, query data, and perform administrative tasks.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                    <ScrollArea className="h-full p-6" ref={scrollAreaRef}>
                        <div className="space-y-6">
                            {(messages || []).map((message) => (
                                <div key={message.id} className={cn(
                                    "flex items-start gap-3 w-full",
                                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                                )}>
                                     {message.sender === 'model' && (
                                        <Avatar className="h-8 w-8 border flex-shrink-0 bg-primary/10 text-primary">
                                            <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                                        </Avatar>
                                     )}
                                    <div className={cn(
                                        "rounded-lg px-4 py-3 max-w-[90%] whitespace-pre-wrap shadow-sm",
                                        message.sender === 'user' ? 'bg-secondary text-secondary-foreground' : 'bg-muted'
                                    )}>
                                        <div className="prose prose-sm prose-invert max-w-none">
                                            <ReactMarkdown components={{ table: MarkdownTable }}>
                                                {message.text}
                                            </ReactMarkdown>
                                        </div>
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
                                    <Avatar className="h-8 w-8 border bg-primary text-primary-foreground">
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
                            placeholder="Ask the AI Assistant..."
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
