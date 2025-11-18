'use client';

import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AuditLog {
    id: string;
    userId: string;
    action: string;
    details: string;
    ipAddress: string;
    timestamp: string;
}

export function AuditLogViewer() {
    const firestore = useFirestore();
    const auditLogsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        // Query to order logs by timestamp in descending order
        return query(collection(firestore, 'auditlogs'), orderBy('timestamp', 'desc'));
    }, [firestore]);

    const { data: auditLogs, isLoading } = useCollection<AuditLog>(auditLogsQuery);

    const getActionVariant = (action: string) => {
        switch (action) {
            case 'bypass_attempt':
            case 'security_alert':
                return 'destructive';
            case 'prediction_request':
                return 'secondary';
            default:
                return 'outline';
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <ShieldAlert className="h-6 w-6 text-warning" />
                    <CardTitle>Prediction & Security Logs</CardTitle>
                </div>
                <CardDescription>Review all prediction requests, failed attempts, and potential bypass logs.</CardDescription>
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
                                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                </TableRow>
                            ))
                        ) : (
                            auditLogs?.map(log => (
                                <TableRow key={log.id} className={getActionVariant(log.action) === 'destructive' ? 'bg-destructive/10' : ''}>
                                    <TableCell className="text-xs">{new Date(log.timestamp).toLocaleString()}</TableCell>
                                    <TableCell className="font-code text-xs">{log.userId}</TableCell>
                                    <TableCell>
                                        <Badge variant={getActionVariant(log.action)}>{log.action}</Badge>
                                    </TableCell>
                                    <TableCell className="text-xs max-w-sm truncate" title={log.details}>{log.details}</TableCell>
                                    <TableCell className="font-code text-xs">{log.ipAddress}</TableCell>
                                </TableRow>
                            ))
                        )}
                        {!isLoading && (!auditLogs || auditLogs.length === 0) && (
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
