'use client';

import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collectionGroup, query } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Ticket } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { License } from '@/lib/types';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

export function LicenseManagement() {
    const firestore = useFirestore();
    
    const licensesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collectionGroup(firestore, 'user_licenses'));
    }, [firestore]);

    const { data: licenses, isLoading } = useCollection<License>(licensesQuery);
    
    const [userIdFilter, setUserIdFilter] = useState('');
    const [gameTypeFilter, setGameTypeFilter] = useState('');


    const getStatusVariant = (license: License) => {
        if (!license.paymentVerified) return 'secondary';
        if (license.isActive) return 'default';
        return 'destructive';
    };

    const getStatusText = (license: License) => {
        if (!license.paymentVerified) return 'Pending Payment';
        if (license.isActive) return 'Active';
        return 'Expired/Inactive';
    }

    const filteredLicenses = licenses?.filter(license => {
        return (
            (userIdFilter ? license.userId.toLowerCase().includes(userIdFilter.toLowerCase()) : true) &&
            (gameTypeFilter ? license.gameType.toLowerCase().includes(gameTypeFilter.toLowerCase()) : true)
        );
    });

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Ticket className="h-6 w-6 text-muted-foreground" />
                    <CardTitle>Global License Management</CardTitle>
                </div>
                <CardDescription>View and manage all user licenses across the platform.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 border rounded-lg">
                    <Input
                        placeholder="Filter by User ID..."
                        value={userIdFilter}
                        onChange={e => setUserIdFilter(e.target.value)}
                    />
                    <Input
                        placeholder="Filter by Game Type..."
                        value={gameTypeFilter}
                        onChange={e => setGameTypeFilter(e.target.value)}
                    />
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User ID</TableHead>
                            <TableHead>License Type</TableHead>
                            <TableHead>Rounds Remaining</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                </TableRow>
                            ))
                        ) : (
                            filteredLicenses?.map(license => (
                                <TableRow key={license.id}>
                                    <TableCell className="font-code text-xs">{license.userId}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{license.gameType}</Badge>
                                    </TableCell>
                                    <TableCell className="font-semibold text-center">{license.roundsRemaining}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(license)} className={getStatusVariant(license) === 'default' ? 'bg-success' : ''}>
                                            {getStatusText(license)}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                        {!isLoading && (!filteredLicenses || filteredLicenses.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">
                                     <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                        <AlertCircle className="h-5 w-5" />
                                        No licenses found.
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}