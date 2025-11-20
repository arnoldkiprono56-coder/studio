
'use client';

import { useState } from 'react';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, User, AlertCircle, Ticket, CreditCard, History } from 'lucide-react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import type { License, Prediction } from '@/lib/types';


interface UserProfile {
  id: string;
  email: string;
  role: 'User' | 'Assistant' | 'Admin' | 'SuperAdmin';
  isSuspended: boolean;
  oneXBetId?: string;
}

interface PaymentTransaction {
    id: string;
    description: string;
    status: string;
    userClaimedAmount: number;
    currency: string;
    createdAt: any;
}


function UserDetails({ user }: { user: UserProfile }) {
    const firestore = useFirestore();

    const licensesQuery = useMemoFirebase(() => 
        !firestore ? null : query(collection(firestore, 'users', user.id, 'user_licenses'), orderBy('createdAt', 'desc'))
    , [firestore, user.id]);

    const transactionsQuery = useMemoFirebase(() => 
        !firestore ? null : query(collection(firestore, 'users', user.id, 'transactions'), orderBy('createdAt', 'desc'), limit(10))
    , [firestore, user.id]);

    const predictionsQuery = useMemoFirebase(() =>
        !firestore ? null : query(collection(firestore, 'users', user.id, 'predictions'), orderBy('timestamp', 'desc'), limit(10))
    , [firestore, user.id]);

    const { data: licenses, isLoading: licensesLoading } = useCollection<License>(licensesQuery);
    const { data: transactions, isLoading: transactionsLoading } = useCollection<PaymentTransaction>(transactionsQuery);
    const { data: predictions, isLoading: predictionsLoading } = useCollection<Prediction>(predictionsQuery);

    const isLoading = licensesLoading || transactionsLoading || predictionsLoading;

    return (
        <div className="space-y-6 mt-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><User /> User Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>User ID:</strong> <span className="font-mono text-sm">{user.id}</span></p>
                    <p><strong>1xBet ID:</strong> {user.oneXBetId || 'Not set'}</p>
                    <p><strong>Role:</strong> <Badge>{user.role}</Badge></p>
                    <p><strong>Status:</strong> <Badge variant={user.isSuspended ? 'destructive' : 'default'}>{user.isSuspended ? 'Suspended' : 'Active'}</Badge></p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Ticket /> Licenses</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Game</TableHead><TableHead>Status</TableHead><TableHead>Rounds Left</TableHead></TableRow></TableHeader>
                        <TableBody>
                        {licensesLoading ? <TableRow><TableCell colSpan={3}><Skeleton className="h-8"/></TableCell></TableRow> : licenses && licenses.length > 0 ? licenses.map(l => (
                            <TableRow key={l.id}>
                                <TableCell>{l.gameType}</TableCell>
                                <TableCell><Badge variant={l.isActive ? 'default' : 'secondary'}>{l.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                                <TableCell>{l.roundsRemaining}</TableCell>
                            </TableRow>
                        )) : <TableRow><TableCell colSpan={3} className="text-center">No licenses found.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            
             <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard /> Recent Purchases</CardTitle></CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                        <TableBody>
                        {transactionsLoading ? <TableRow><TableCell colSpan={4}><Skeleton className="h-8"/></TableCell></TableRow> : transactions && transactions.length > 0 ? transactions.map(t => (
                            <TableRow key={t.id}>
                                <TableCell>{t.createdAt?.toDate().toLocaleDateString()}</TableCell>
                                <TableCell>{t.description}</TableCell>
                                <TableCell>{formatCurrency(t.userClaimedAmount, t.currency)}</TableCell>
                                <TableCell><Badge variant={t.status === 'completed' || t.status === 'verified' ? 'default' : t.status === 'pending' ? 'secondary' : 'destructive'}>{t.status}</Badge></TableCell>
                            </TableRow>
                        )) : <TableRow><TableCell colSpan={4} className="text-center">No transactions found.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><History /> Prediction History</CardTitle></CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Game</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                        <TableBody>
                        {predictionsLoading ? <TableRow><TableCell colSpan={3}><Skeleton className="h-8"/></TableCell></TableRow> : predictions && predictions.length > 0 ? predictions.map(p => (
                            <TableRow key={p.id}>
                                <TableCell>{p.timestamp?.toDate().toLocaleString()}</TableCell>
                                <TableCell>{p.gameType}</TableCell>
                                <TableCell><Badge variant={p.status === 'won' ? 'default' : p.status === 'pending' ? 'secondary' : 'destructive'}>{p.status}</Badge></TableCell>
                            </TableRow>
                        )) : <TableRow><TableCell colSpan={3} className="text-center">No predictions found.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

export default function UserLookupPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [foundUser, setFoundUser] = useState<UserProfile | null>(null);

    const handleSearch = async () => {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Firestore is not available.' });
            return;
        }
        if (!searchTerm.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a user email.' });
            return;
        }

        setIsSearching(true);
        setFoundUser(null);

        try {
            const usersRef = collection(firestore, 'users');
            const q = query(usersRef, where('email', '==', searchTerm.trim()), limit(1));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast({ variant: 'destructive', title: 'Not Found', description: 'No user found with that email address.' });
            } else {
                const userDoc = querySnapshot.docs[0];
                setFoundUser({ id: userDoc.id, ...userDoc.data() } as UserProfile);
            }
        } catch (error: any) {
            console.error("User lookup error:", error);
            toast({ variant: 'destructive', title: 'Search Failed', description: error.message });
        } finally {
            setIsSearching(false);
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Search className="h-6 w-6 text-muted-foreground" />
                    <CardTitle>User Lookup</CardTitle>
                </div>
                <CardDescription>
                    Enter a user's email to find their profile and activity history.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex w-full max-w-sm items-center space-x-2">
                    <Input
                        type="email"
                        placeholder="user@example.com"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button onClick={handleSearch} disabled={isSearching}>
                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        <span className="sr-only sm:not-sr-only sm:ml-2">Search</span>
                    </Button>
                </div>

                {isSearching && (
                    <div className="mt-6 space-y-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                )}
                
                {foundUser && <UserDetails user={foundUser} />}
            </CardContent>
        </Card>
    );
}
