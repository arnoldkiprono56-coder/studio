
'use client';

import { useProfile } from "@/context/profile-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Gift, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { formatCurrency } from "@/lib/utils";

interface ReferredUser {
    id: string;
    email: string;
    hasPurchased: boolean;
}

export default function ReferralsPage() {
    const { userProfile, isProfileLoading } = useProfile();
    const { toast } = useToast();
    const firestore = useFirestore();

    const referralCode = userProfile ? `PRO-${userProfile.id.substring(0, 6).toUpperCase()}` : '';

    const referralsQuery = useMemoFirebase(() => {
        if (!userProfile?.id || !firestore) return null;
        return query(
            collection(firestore, 'users'),
            where('referredBy', '==', userProfile.id)
        );
    }, [userProfile?.id, firestore]);

    const { data: referredUsers, isLoading: isReferralsLoading } = useCollection<ReferredUser>(referralsQuery);

    const handleCopyReferral = () => {
        if (referralCode) {
            navigator.clipboard.writeText(referralCode);
            toast({ title: "Copied!", description: "Referral code copied to clipboard." });
        }
    };
    
    const isLoading = isProfileLoading || isReferralsLoading;
    const successfulReferrals = referredUsers?.filter(u => u.hasPurchased).length || 0;
    const totalCommission = successfulReferrals * 150;

    return (
        <div className="space-y-8">
             <div>
                <h1 className="text-3xl font-bold tracking-tight">Refer a Friend</h1>
                <p className="text-muted-foreground">Earn commissions by inviting friends to PredictPro.</p>
            </div>

             <Card>
                <CardHeader>
                    <CardTitle>Your Referral Code</CardTitle>
                    <CardDescription>Share this code with your friends. When they make their first purchase, you earn a KES 150 commission.</CardDescription>
                </CardHeader>
                <CardContent>
                     {isLoading ? <Skeleton className="h-10 w-full" /> : (
                        <div className="flex items-center gap-2">
                            <Input id="referral" readOnly value={referralCode} className="font-code text-lg" />
                            <Button variant="outline" size="icon" onClick={handleCopyReferral}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                     )}
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-8 w-12" /> : (
                           <div className="text-2xl font-bold">{referredUsers?.length || 0}</div>
                        )}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Successful Referrals</CardTitle>
                        <Gift className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-8 w-12" /> : (
                            <div className="text-2xl font-bold">{successfulReferrals}</div>
                        )}
                         <p className="text-xs text-muted-foreground">Users who made a purchase</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Commission Earned</CardTitle>
                        <span className="text-muted-foreground font-bold">KES</span>
                    </CardHeader>
                    <CardContent>
                         {isLoading ? <Skeleton className="h-8 w-24" /> : (
                            <div className="text-2xl font-bold">{formatCurrency(totalCommission, 'KES')}</div>
                         )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
