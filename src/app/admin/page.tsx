'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PricingManagement } from "./pricing-management";
import { PromptManagement } from "./prompt-management";
import { GamesControl } from "./games-control";


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
            <Tabs defaultValue="pricing" className="space-y-4">
                <TabsList className="grid w-full grid-cols-1 h-auto sm:w-auto sm:inline-flex sm:grid-cols-none">
                    <TabsTrigger value="pricing">Pricing</TabsTrigger>
                    <TabsTrigger value="prompts">Prompts</TabsTrigger>
                    <TabsTrigger value="games">Games</TabsTrigger>
                </TabsList>
                 <TabsContent value="pricing" className="space-y-4">
                    <PricingManagement />
                </TabsContent>
                 <TabsContent value="prompts" className="space-y-4">
                    <PromptManagement />
                </TabsContent>
                <TabsContent value="games" className="space-y-4">
                    <GamesControl />
                </TabsContent>
            </Tabs>
        </div>
    );
}
