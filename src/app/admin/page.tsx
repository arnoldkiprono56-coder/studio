'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagementTable } from "./user-management";
import { TransactionManagement } from "./transaction-management";
import { PricingManagement } from "./pricing-management";
import { PromptManagement } from "./prompt-management";
import { AuditLogViewer } from "./audit-log";
import { LicenseManagement } from "./license-management";
import { PredictionLogs } from "./prediction-logs";
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
            <Tabs defaultValue="users" className="space-y-4">
                <TabsList className="grid w-full grid-cols-1 h-auto sm:w-auto sm:inline-flex sm:grid-cols-none">
                    <TabsTrigger value="users">User Management</TabsTrigger>
                    <TabsTrigger value="licenses">Licenses</TabsTrigger>
                    <TabsTrigger value="predictions">Predictions</TabsTrigger>
                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                    <TabsTrigger value="pricing">Pricing</TabsTrigger>
                    <TabsTrigger value="prompts">Prompts</TabsTrigger>
                    <TabsTrigger value="games">Games</TabsTrigger>
                    <TabsTrigger value="audit">Audit Log</TabsTrigger>
                </TabsList>
                <TabsContent value="users" className="space-y-4">
                    <UserManagementTable />
                </TabsContent>
                <TabsContent value="licenses" className="space-y-4">
                    <LicenseManagement />
                </TabsContent>
                <TabsContent value="predictions" className="space-y-4">
                    <PredictionLogs />
                </TabsContent>
                 <TabsContent value="transactions" className="space-y-4">
                    <TransactionManagement />
                </TabsContent>
                 <TabsContent value="pricing" className="space-y-4">
                    <PricingManagement />
                </TabsContent>
                 <TabsContent value="prompts" className="space-y-4">
                    <PromptManagement />
                </TabsContent>
                <TabsContent value="games" className="space-y-4">
                    <GamesControl />
                </TabsContent>
                 <TabsContent value="audit" className="space-y-4">
                    <AuditLogViewer />
                </TabsContent>
            </Tabs>
        </div>
    );
}
