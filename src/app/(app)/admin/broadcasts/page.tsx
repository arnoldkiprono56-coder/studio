
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BroadcastForm } from '@/app/admin/broadcast-form';
import { BroadcastLog } from './broadcast-log';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';


export default function AdminBroadcastPage() {
    return (
        <div className="space-y-6">
             <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/admin">
                        <ArrowLeft />
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Broadcasts</h1>
            </div>
            <Tabs defaultValue="send">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="send">Send New</TabsTrigger>
                    <TabsTrigger value="log">History</TabsTrigger>
                </TabsList>
                <TabsContent value="send" className="mt-6">
                    <BroadcastForm />
                </TabsContent>
                <TabsContent value="log" className="mt-6">
                    <BroadcastLog />
                </TabsContent>
            </Tabs>
        </div>
    );
}
