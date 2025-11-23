'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Bot } from 'lucide-react';
import Link from 'next/link';

function ChatComponent() {
    const params = useParams();
    const chatType = Array.isArray(params.chatType) ? params.chatType[0] : params.chatType;

    const getChatTitle = () => {
        if (!chatType) return 'Support Chat';
        return chatType.charAt(0).toUpperCase() + chatType.slice(1).replace('-', ' ') + ' Chat';
    }

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
            <Card className="flex-1 flex flex-col items-center justify-center text-center">
                <CardHeader>
                    <div className="mx-auto bg-muted/50 p-4 rounded-full">
                        <Bot className="w-12 h-12 text-muted-foreground" />
                    </div>
                </CardHeader>
                <CardContent>
                    <CardTitle className="mb-2">Chat Disabled</CardTitle>
                    <p className="text-muted-foreground">
                        This feature is not available because API dependencies have been removed.
                    </p>
                </CardContent>
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
