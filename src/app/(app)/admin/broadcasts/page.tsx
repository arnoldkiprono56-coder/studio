
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BroadcastForm } from '@/app/admin/broadcast-form';
import { BroadcastLog } from './broadcast-log';


export default function AdminBroadcastPage() {
    return (
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
    );
}
