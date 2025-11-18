'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';


type Message = {
    id: number;
    text: string;
    sender: 'user' | 'support';
};

export default function ChatPage() {
    const params = useParams();
    const chatType = Array.isArray(params.chatType) ? params.chatType[0] : params.chatType;

    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: `Welcome to ${chatType} support! How can I help you?`, sender: 'support' }
    ]);
    const [input, setInput] = useState('');

    const handleSendMessage = () => {
        if (input.trim()) {
            const newMessage: Message = { id: messages.length + 1, text: input, sender: 'user' };
            setMessages([...messages, newMessage]);
            setInput('');
            
            // Simulate a support reply
            setTimeout(() => {
                const reply: Message = {id: messages.length + 2, text: `This is a simulated reply for your query about "${input}".`, sender: 'support' };
                setMessages(prev => [...prev, reply]);
            }, 1000);
        }
    };

    const getChatTitle = () => {
        if (!chatType) return 'Support Chat';
        return chatType.charAt(0).toUpperCase() + chatType.slice(1).replace('-', ' ') + ' Chat';
    }


    return (
        <div className="flex flex-col h-[80vh]">
            <div className="flex items-center mb-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/support">
                        <ChevronLeft className="h-6 w-6" />
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold tracking-tight ml-2">{getChatTitle()}</h1>
            </div>
            <Card className="flex-grow flex flex-col">
                <CardContent className="flex-grow p-0">
                    <ScrollArea className="h-full p-6">
                        <div className="space-y-4">
                            {messages.map((message) => (
                                <div key={message.id} className={cn(
                                    "flex items-end gap-2",
                                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                                )}>
                                    {message.sender === 'support' && (
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback>S</AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className={cn(
                                        "rounded-lg px-4 py-2 max-w-[75%]",
                                        message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                    )}>
                                        <p className="text-sm">{message.text}</p>
                                    </div>
                                     {message.sender === 'user' && (
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback>U</AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            ))}
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
                        />
                        <Button type="submit" size="icon" onClick={handleSendMessage}>
                            <Send className="h-4 w-4" />
                            <span className="sr-only">Send</span>
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}