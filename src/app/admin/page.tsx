
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, AlertTriangle, ShieldCheck, Gem } from "lucide-react";
import { UserManagementTable } from "./user-management";
import { TransactionManagement } from "./transaction-management";
import { AuditLogViewer } from "./audit-log";
import { PricingManagement } from "./pricing-management";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProfile } from "@/context/profile-context";
import { Skeleton } from "@/components/ui/skeleton";
import { PromptManagement } from "./prompt-management";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, collectionGroup, query, where } from "firebase/firestore";

export default function AdminDashboardPage() {
    const { userProfile, isProfileLoading } = useProfile();
    const firestore = useFirestore();

    const usersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
    const { data: users, isLoading: usersLoading } = useCollection(usersQuery);

    const licensesQuery = useMemoFirebase(() => firestore ? query(collectionGroup(firestore, 'licenses'), where('isActive', '==', true)) : null, [firestore]);
    const { data: activeLicenses, isLoading: licensesLoading } = useCollection(licensesQuery);

    const alertsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'auditlogs'), where('action', 'in', ['bypass_attempt', 'security_alert'])) : null, [firestore]);
    const { data: securityAlerts, isLoading: alertsLoading } = useCollection(alertsQuery);


    if (isProfileLoading || !userProfile || usersLoading || licensesLoading || alertsLoading) {
        return (
            <div className="space-y-8">
                <div>
                    <Skeleton className="h-9 w-64 mb-2" />
                    <Skeleton className="h-5 w-80" />
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                         <Card key={i}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-4 w-4" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-16 mb-2" />
                                <Skeleton className="h-4 w-32" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                 <Skeleton className="h-10 w-full" />
                 <Skeleton className="h-[400px] w-full" />
            </div>
        )
    }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome, {userProfile.role}. Here's the platform overview.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users?.length ?? 0}</div>
            <p className="text-xs text-muted-foreground">Registered users on the platform</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Licenses</CardTitle>
            <Gem className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLicenses?.length ?? 0}</div>
            <p className="text-xs text-muted-foreground">Currently active user licenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityAlerts?.length ?? 0}</div>
            <p className="text-xs text-muted-foreground">Critical alerts require attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">Operational</div>
            <p className="text-xs text-muted-foreground">All systems are running normally.</p>
          </CardContent>
        </Card>
      </div>
      
        <Tabs defaultValue="users" className="space-y-4">
            <TabsList>
                <TabsTrigger value="users">User Management</TabsTrigger>
                <TabsTrigger value="pricing">Pricing & Plans</TabsTrigger>
                <TabsTrigger value="prompts">AI Prompts</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                <TabsTrigger value="security">Security Logs</TabsTrigger>
            </TabsList>
            <TabsContent value="users">
                <UserManagementTable />
            </TabsContent>
            <TabsContent value="pricing">
                <PricingManagement />
            </TabsContent>
            <TabsContent value="prompts">
                <PromptManagement />
            </TabsContent>
            <TabsContent value="transactions">
                <TransactionManagement />
            </TabsContent>
            <TabsContent value="security">
                <AuditLogViewer />
            </TabsContent>
        </Tabs>
    </div>
  );
}
