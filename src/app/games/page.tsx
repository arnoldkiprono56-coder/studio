
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/context/profile-context';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowRight, Zap, Shield, Gem, Ticket } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { License } from '@/lib/types';


const games = [
    { 
        name: "VIP Slip", 
        planId: "vip-slip",
        href: "/games/vip-slip", 
        description: "Get a VIP slip with 3-5 high-confidence matches for 1xBet.",
        icon: Ticket,
        accent: "hsl(var(--primary))"
    },
    { 
        name: "Aviator", 
        planId: "aviator",
        href: "/games/aviator", 
        description: "Predict the best time to cash out before the plane flies away.",
        icon: Zap,
        accent: "hsl(var(--accent-basic))"
    },
    { 
        name: "Crash", 
        planId: "crash",
        href: "/games/crash", 
        description: "Anticipate the crash point of the rising multiplier.",
        icon: Shield,
        accent: "hsl(var(--accent-standard))"

    },
    { 
        name: "Mines & Gems", 
        planId: "mines-gems",
        href: "/games/gems-mines", 
        description: "Uncover valuable gems while avoiding hidden mines.",
        icon: Gem,
        accent: "hsl(var(--accent-pro))"
    }
]

export default function GamesPage() {
    const { userProfile, isProfileLoading } = useProfile();
    const router = useRouter();
    const firestore = useFirestore();

     const licensesQuery = useMemoFirebase(() => {
        if (!userProfile?.id || !firestore) return null;
        return query(
            collection(firestore, 'users', userProfile.id, 'user_licenses')
        );
    }, [userProfile?.id, firestore]);

    const { data: allLicenses, isLoading: licensesLoading } = useCollection<License>(licensesQuery);

    useEffect(() => {
        if (!isProfileLoading && userProfile) {
            const isAdmin = userProfile.role === 'SuperAdmin' || userProfile.role === 'Admin' || userProfile.role === 'Assistant';
            if (isAdmin) {
                router.replace('/admin');
            }
        }
    }, [userProfile, isProfileLoading, router]);

    const isLoading = isProfileLoading || !userProfile || licensesLoading;

    if (isLoading || ['SuperAdmin', 'Admin', 'Assistant'].includes(userProfile?.role || '')) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-9 w-64 mb-2" />
                <Skeleton className="h-5 w-80" />
                <div className="grid gap-6 md:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader><Skeleton className="h-8 w-48" /></CardHeader>
                            <CardContent className="space-y-4">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Games Hub</h1>
        <p className="text-muted-foreground">Select a game to view predictions and analytics.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {games.map(game => {
            const Icon = game.icon;
            const hasActiveLicense = allLicenses?.some(l => l.gameType === game.name && l.isActive);
            const status = hasActiveLicense ? 'active' : 'locked';
            
            return (
                <Card key={game.name} className="flex flex-col hover:border-primary transition-all">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg" style={{backgroundColor: game.accent + '20'}}>
                                    <Icon className="w-6 h-6" style={{color: game.accent}} />
                                </div>
                                <CardTitle className="text-2xl">{game.name}</CardTitle>
                            </div>
                            <Badge variant={status === 'active' ? 'default' : 'secondary'} className={status === 'active' ? 'bg-success/80' : ''}>
                                {status}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col">
                        <CardDescription className="flex-grow">{game.description}</CardDescription>
                        <div className="mt-6">
                            {status === 'active' ? (
                                <Button asChild className="w-full">
                                    <Link href={game.href}>
                                        Access Predictions <ArrowRight className="w-4 h-4 ml-2" />
                                    </Link>
                                </Button>
                            ) : (
                                <Button asChild variant="secondary" className="w-full">
                                    <Link href={`/purchase/${game.planId}`}>
                                        Buy License <ArrowRight className="w-4 h-4 ml-2" />
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )
        })}
      </div>
    </div>
  );
}
