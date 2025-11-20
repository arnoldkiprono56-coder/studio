
'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/context/profile-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Star } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import OnboardingPage from "@/app/(app)/onboarding/page";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, limit, orderBy } from "firebase/firestore";
import type { License, Prediction } from "@/lib/types";
import { PredictionHistory } from "./prediction-history";


const games = [
    { name: "VIP Slip", href: "/games/vip-slip", planId: "vip-slip" },
    { name: "Aviator", href: "/games/aviator", planId: "aviator" },
    { name: "Crash", href: "/games/crash", planId: "crash" },
    { name: "Mines & Gems", href: "/games/gems-mines", planId: "mines-gems" },
]

export default function DashboardPage() {
  const { userProfile, isProfileLoading } = useProfile();
  const router = useRouter();
  const firestore = useFirestore();

  const licensesQuery = useMemoFirebase(() => {
    if (!userProfile?.id || !firestore) return null;
    return query(
        collection(firestore, 'users', userProfile.id, 'user_licenses'),
    );
  }, [userProfile?.id, firestore]);

  const { data: allLicenses, isLoading: licensesLoading } = useCollection<License>(licensesQuery);

  const activeLicenses = allLicenses?.filter(l => l.isActive);

  useEffect(() => {
    if (!isProfileLoading && userProfile) {
      if (userProfile.role === 'SuperAdmin' || userProfile.role === 'Admin' || userProfile.role === 'Assistant') {
        router.replace('/admin');
      }
    }
  }, [userProfile, isProfileLoading, router]);

  if (isProfileLoading || !userProfile || licensesLoading) {
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <Skeleton className="h-9 w-64 mb-2" />
                    <Skeleton className="h-5 w-80" />
                </div>
                <Skeleton className="h-8 w-28" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader><Skeleton className="h-6 w-32 mb-2" /><Skeleton className="h-4 w-24" /></CardHeader>
                    <CardContent><Skeleton className="h-10 w-full" /></CardContent>
                </Card>
                <Card>
                    <CardHeader><Skeleton className="h-6 w-32 mb-2" /><Skeleton className="h-4 w-40" /></CardHeader>
                    <CardContent><Skeleton className="h-9 w-32" /></CardContent>
                </Card>
                <Card>
                    <CardHeader><Skeleton className="h-6 w-32 mb-2" /><Skeleton className="h-4 w-36" /></CardHeader>
                    <CardContent><Skeleton className="h-9 w-16" /></CardContent>
                </Card>
            </div>
            <div>
                <Skeleton className="h-8 w-48 mb-4" />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader><Skeleton className="h-6 w-24" /></CardHeader>
                            <CardContent><Skeleton className="h-9 w-32" /></CardContent>
                        </Card>
                    ))}
                </div>
            </div>
             <div>
                <Skeleton className="h-8 w-56 mb-4" />
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
  }

  // Only render user dashboard if role is not Admin/SuperAdmin
  if (['SuperAdmin', 'Admin', 'Assistant'].includes(userProfile.role)) {
    return null; // or a loading indicator while redirecting
  }

  if (!userProfile.oneXBetId) {
    return <OnboardingPage />;
  }

  const userName = userProfile.email?.split('@')[0] || "Player";
  const walletBalance = userProfile.balance || 0;

  const hasActiveLicenses = activeLicenses && activeLicenses.length > 0;
  const userPlan = hasActiveLicenses ? 'Active' : 'No Plan';


  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {userName}!</h1>
          <p className="text-muted-foreground">Here&apos;s your gaming analytics overview.</p>
        </div>
        {hasActiveLicenses && (
            <Badge variant="outline" className="text-base border-success text-success py-1 px-3">
              <Star className="w-4 h-4 mr-2 fill-success" />
              Active Licenses
            </Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>{userPlan}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/games">
              <Button className="w-full">
                {hasActiveLicenses ? 'View Games' : 'Purchase a License'}
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Wallet Balance</CardTitle>
            <CardDescription>Your current account balance.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(walletBalance)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Licenses</CardTitle>
            <CardDescription>Licenses currently in use.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeLicenses?.length ?? 0}</p>
          </CardContent>
        </Card>
      </div>
      
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-4">Game Access</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {games.map(game => {
                 const hasLicense = activeLicenses?.some(l => l.gameType === game.name);
                 const status = hasLicense ? 'active' : 'locked';
                 return (
                 <Card key={game.name} className="hover:bg-accent/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg">{game.name}</CardTitle>
                        <Badge variant={status === 'active' ? 'default' : 'secondary'} className={status === 'active' ? 'bg-success' : ''}>{status}</Badge>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            {status === 'active' ? 'Predictions available' : 'License required'}
                        </p>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={game.href}>Go to game <ArrowRight className="w-4 h-4 ml-2" /></Link>
                        </Button>
                    </CardContent>
                 </Card>
                 )
            })}
        </div>
      </div>

      <PredictionHistory />
    </div>
  );
}

    