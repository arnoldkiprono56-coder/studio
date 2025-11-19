
'use client';

import { useCollection } from '@/firebase/firestore/use-collection';
import { useProfile } from '@/context/profile-context';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { License } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Ticket } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function LicensesPage() {
    const { userProfile, isProfileLoading } = useProfile();
    const firestore = useFirestore();

    const licensesQuery = useMemoFirebase(() => {
        if (!userProfile?.id || !firestore) return null;
        return query(
            collection(firestore, 'users', userProfile.id, 'user_licenses'),
            orderBy('createdAt', 'desc')
        );
    }, [userProfile?.id, firestore]);

    const { data: licenses, isLoading: isLicensesLoading } = useCollection<License>(licensesQuery);

    const isLoading = isProfileLoading || isLicensesLoading;

    const getStatus = (license: License): { text: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' } => {
        if (!license.paymentVerified) return { text: 'Pending Payment', variant: 'outline' };
        if (license.roundsRemaining <= 0) return { text: 'Expired', variant: 'destructive' };
        if (license.isActive) return { text: 'Active', variant: 'default' };
        return { text: 'Inactive', variant: 'secondary' };
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Licenses</h1>
                <p className="text-muted-foreground">An overview of all your purchased game licenses.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Your Licenses</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Game</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Rounds Remaining</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    </TableRow>
                                ))
                            ) : licenses && licenses.length > 0 ? (
                                licenses.map(license => {
                                    const status = getStatus(license);
                                    const progress = (license.roundsRemaining / 100) * 100;
                                    return (
                                        <TableRow key={license.id}>
                                            <TableCell className="font-medium">{license.gameType}</TableCell>
                                            <TableCell>
                                                <Badge variant={status.variant} className={status.variant === 'default' ? 'bg-success' : ''}>
                                                    {status.text}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Progress value={progress} className="w-32 h-2" />
                                                    <span className="text-muted-foreground text-sm font-medium">
                                                        {license.roundsRemaining} / 100
                                                    </span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                            <AlertCircle className="h-5 w-5" />
                                            You haven't purchased any licenses yet.
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
