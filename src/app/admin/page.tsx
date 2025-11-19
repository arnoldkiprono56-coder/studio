'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PricingManagement } from "./pricing-management";
import { GamesControl } from "./games-control";
import Link from "next/link";


function DashboardHeader() {
    return (
        <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Platform overview and management tools.</p>
        </div>
    );
}


export default function AdminDashboardPage() {
    return (
        <div className="space-y-8">
            <DashboardHeader />
            <Tabs defaultValue="dashboard" className="space-y-4">
                <TabsList className="grid w-full grid-cols-1 h-auto sm:w-auto sm:inline-flex sm:grid-cols-none">
                    <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                    <TabsTrigger value="users"><Link href="/admin/users">Users</Link></TabsTrigger>
                    <TabsTrigger value="pricing">Pricing</TabsTrigger>
                    <TabsTrigger value="games">Games</TabsTrigger>
                </TabsList>
                 <TabsContent value="dashboard" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Welcome, Admin!</CardTitle>
                            <CardDescription>Select a tab to manage different parts of the application.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>This is the main dashboard overview. Key metrics and reports will be displayed here in the future.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="pricing" className="space-y-4">
                    <PricingManagement />
                </TabsContent>
                <TabsContent value="games" className="space-y-4">
                    <GamesControl />
                </TabsContent>
            </Tabs>
        </div>
    );
}
