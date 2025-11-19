'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, AlertTriangle, ShieldCheck, Gem, DollarSign, Clock, BrainCircuit, ShieldAlert } from "lucide-react";
import { TransactionManagement } from "./transaction-management";
import { AuditLogViewer } from "./audit-log";
import { PricingManagement } from "./pricing-management";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProfile } from "@/context/profile-context";
import { Skeleton } from "@/components/ui/skeleton";
import { PromptManagement } from "./prompt-management";
import { useFirestore, useMemoFirebase } from "@/firebase";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, collectionGroup, query, where } from "firebase/firestore";
import { formatCurrency } from "@/lib/utils";

export default function AdminDashboardPage() {
    const { userProfile, isProfileLoading } = useProfile();
    const firestore = useFirestore();

    const licensesQuery = useMemoFirebase(() => firestore ? query(collectionGroup(firestore, 'user_licenses'), where('isActive', '==', true)) : null, [firestore]);
    const { data: activeLicenses, isLoading: licensesLoading } = useCollection(licensesQuery);
    
    const transactionsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'transactions') : null, [firestore]);
    const { data: transactions, isLoading: transactionsLoading } = useCollection(transactionsQuery);

    const predictionsQuery = useMemoFirebase(() => firestore ? collectionGroup(firestore, 'predictions') : null, [firestore]);
    const { data: predictions, isLoading: predictionsLoading } = useCollection(predictionsQuery);
    
    const alertsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'auditlogs'), where('action', 'in', ['bypass_attempt', 'security_alert'])) : null, [firestore]);
    const { data: securityAlerts, isLoading: alertsLoading } = useCollection(alertsQuery);

    const isLoading = isProfileLoading || licensesLoading || transactionsLoading || predictionsLoading || alertsLoading;
    
    const totalRevenue = transactions?.filter(t => t.status === 'verified').reduce((sum, t) => sum + t.amount, 0) || 0;
    const pendingVerifications = transactions?.filter(t => t.status === 'pending').length || 0;


    if (isLoading || !userProfile) {
        return (
            <div className="space-y-8">
                <div>
                    <Skeleton className="h-9 w-64 mb-2" />
                    <Skeleton className="h-5 w-80" />
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
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
                 <Skeleton className="h-10 w-[480px]" />
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
            <CardTitle className="text-sm font-medium">Active Licenses</CardTitle>
            <Gem className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLicenses?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Currently active user licenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue, 'KES')}</div>
            <p className="text-xs text-muted-foreground">Verified transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingVerifications}</div>
            <p className="text-xs text-muted-foreground">Payments awaiting approval</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Prediction Usage</CardTitle>
            <BrainCircuit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{predictions?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Total predictions generated</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{securityAlerts?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Critical alerts to review</p>
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
      
        <Tabs defaultValue="pricing" className="space-y-4">
            <TabsList>
                <TabsTrigger value="pricing">Pricing & Plans</TabsTrigger>
                <TabsTrigger value="prompts">AI Prompts</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                <TabsTrigger value="security">Security Logs</TabsTrigger>
            </TabsList>
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
