'use client';

import { useState } from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuditLog {
    id: string;
    userId: string;
    action: string;
    details: string;
    ipAddress: string;
    timestamp: string; 
}

const actionColorMap: Record<string, string> = {
    'prediction_request': 'bg-sky-blue/20 text-sky-blue',
    'bypass_attempt': 'bg-destructive/20 text-destructive font-bold',
    'license_expired': 'bg-warning/20 text-warning',
};

export function AuditLogViewer() {
    const firestore = useFirestore();
    const auditLogsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'auditlogs'), orderBy('timestamp', 'desc'));
    }, [firestore]);

    const { data: logs, isLoading } = useCollection<AuditLog>(auditLogsCollection);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                    <CardTitle>Audit Trail & Security Logs</CardTitle>
                </div>
                <CardDescription>
                    A chronological record of significant actions on the platform for security and monitoring.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>User ID</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Details</TableHead>
                            <TableHead>IP Address</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-64" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                </TableRow>
                            ))
                        ) : logs && logs.length > 0 ? (
                            logs.map(log => (
                                <TableRow key={log.id}>
                                    <TableCell className="text-sm text-muted-foreground font-code">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="font-code text-xs">{log.userId}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn("border-none", actionColorMap[log.action] || 'bg-secondary/20')}>
                                            {log.action}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs max-w-sm truncate">{log.details}</TableCell>
                                    <TableCell className="text-muted-foreground font-code text-xs">{log.ipAddress}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">
                                     <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                        <AlertCircle className="h-5 w-5" />
                                        No audit logs found.
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
