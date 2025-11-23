'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bot } from 'lucide-react';
import Link from 'next/link';

export default function AdminAssistantPage() {
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
            <Card className="flex-1 flex flex-col items-center justify-center text-center">
                 <CardHeader>
                    <div className="mx-auto bg-muted/50 p-4 rounded-full">
                        <Bot className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <CardTitle>AI Assistant Disabled</CardTitle>
                    <CardDescription>
                        This feature has been temporarily disabled.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        The conversational AI assistant is not available because API dependencies have been removed.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
