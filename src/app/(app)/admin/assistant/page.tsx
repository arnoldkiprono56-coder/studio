'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { generateSupportResponse } from '@/ai/flows/generate-support-response';

type Message = {
    id: number;
    text: string;
    sender: 'user' | 'model';
};

export default function AdminAssistantPage() {
    const chatType = 'manager'; // Hard-coded for the admin assistant
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: `Welcome, Admin. I am the system manager AI. How can I assist you with platform operations, security analysis, or troubleshooting today?`, sender: 'model' }
    ]);
    const [input, setInput] = useState('');

    const scrollToBottom = () => {
        setTimeout(() => {
            const scrollViewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollViewport) {
                scrollViewport.scrollTo({ top: scrollViewport.scrollHeight, behavior: 'smooth' });
            }
        }, 100);
    };

    const handleSendMessage = async () => {
        if (input.trim() && !isLoading) {
            const currentInput = input;
            const userMessage: Message = { id: Date.now(), text: currentInput, sender: 'user' };
            
            const conversationHistory = messages.map(m => ({
                isUser: m.sender === 'user',
                text: m.text
            }));
            
            setMessages(prev => [...prev, userMessage]);
            setInput('');
            setIsLoading(true);
            scrollToBottom();

            try {
                const result = await generateSupportResponse({
                    message: currentInput,
                    chatType: chatType,
                    history: conversationHistory,
                });
                
                const aiMessage: Message = { id: Date.now() + 1, text: result.response, sender: 'model' };
                setMessages(prev => [...prev, aiMessage]);
            } catch (error) {
                console.error("Failed to get AI response:", error);
                const errorMessage: Message = { id: Date.now() + 1, text: "Sorry, I'm having trouble connecting. Please try again later.", sender: 'model' };
                setMessages(prev => [...prev, errorMessage]);
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
            <Card className="flex-1 flex flex-col">
                <CardContent className="flex-1 p-0">
                    <ScrollArea className="h-full p-6" ref={scrollAreaRef}>
                        <div className="space-y-6">
                            {messages.map((message) => (
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
                                        message.sender === 'user' ? 'bg-secondary text-secondary-foreground' : 'bg-muted'
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
