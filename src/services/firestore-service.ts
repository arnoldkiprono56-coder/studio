'use server';

import { firestore } from '@/firebase/server-init';
import { collection, getDocs, query, where, orderBy, limit, addDoc, serverTimestamp, doc, updateDoc, writeBatch, setDoc } from 'firebase/firestore';

// Note: In a real app, you'd add robust error handling and pagination.

export async function fetchUsers({ newSinceHours }: { newSinceHours?: number }) {
    const usersRef = collection(firestore, 'users');
    let q = query(usersRef, orderBy('createdAt', 'desc'));

    if (newSinceHours) {
        const d = new Date();
        d.setHours(d.getHours() - newSinceHours);
        q = query(q, where('createdAt', '>=', d.toISOString()));
    }
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return 'No users found matching the criteria.';
    }

    const users = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            Email: data.email,
            Role: data.role,
            'Created At': new Date(data.createdAt).toLocaleString(),
        };
    });
    
    const headers = Object.keys(users[0]);
    const rows = users.map(user => headers.map(header => user[header as keyof typeof user]));
    
    return [
        headers.join(' | '),
        headers.map(() => '---').join(' | '),
        ...rows.map(row => row.join(' | '))
    ].join('\n');
}

export async function fetchAuditLogs({ action, limit: queryLimit = 10 }: { action: string, limit?: number }) {
    const auditLogsRef = collection(firestore, 'auditlogs');
    const q = query(
        auditLogsRef,
        where('action', '==', action),
        orderBy('timestamp', 'desc'),
        limit(queryLimit)
    );

    const snapshot = await getDocs(q);
     if (snapshot.empty) {
        return `No audit logs found for action: ${action}.`;
    }

    const logs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            'User ID': data.userId,
            Action: data.action,
            Details: data.details,
            Timestamp: data.timestamp.toDate().toLocaleString(),
        };
    });

    const headers = Object.keys(logs[0]);
    const rows = logs.map(log => headers.map(header => log[header as keyof typeof log]));

    return [
        headers.join(' | '),
        headers.map(() => '---').join(' | '),
        ...rows.map(row => row.join(' | '))
    ].join('\n');
}

export async function fetchPreVerifiedPayments() {
    const paymentsRef = collection(firestore, 'preVerifiedPayments');
    const q = query(paymentsRef, where('status', '==', 'available'), orderBy('createdAt', 'desc'));

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return 'No available pre-verified credits found.';
    }
    const payments = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            'Transaction ID': data.transactionId,
            Amount: data.amount,
            Currency: data.currency,
            'Date Added': data.createdAt.toDate().toLocaleDateString(),
        };
    });

    const headers = Object.keys(payments[0]);
    const rows = payments.map(payment => headers.map(header => payment[header as keyof typeof payment]));

    return [
        headers.join(' | '),
        headers.map(() => '---').join(' | '),
        ...rows.map(row => row.join(' | '))
    ].join('\n');
}

export async function addPreVerifiedPayment({ transactionId, amount, adminId }: { transactionId: string; amount: number; adminId: string; }) {
    try {
        const upperCaseTxId = transactionId.trim().toUpperCase();
        const docRef = doc(firestore, 'preVerifiedPayments', upperCaseTxId);

        const payload = {
            transactionId: upperCaseTxId,
            amount: amount,
            currency: 'KES',
            status: 'available',
            adminId: adminId,
            createdAt: serverTimestamp(),
        };
        
        await setDoc(docRef, payload);
        return { success: true, message: `Successfully created pre-verified credit for ${upperCaseTxId}.` };
    } catch (error: any) {
        return { success: false, message: `Failed to create pre-verified credit: ${error.message}` };
    }
}


export async function createBroadcast({ message, audience }: { message: string; audience: string; }) {
    try {
        const notificationsCollection = collection(firestore, 'notifications');
        const newDoc = await addDoc(notificationsCollection, {
            message,
            targetAudience: audience,
            senderId: 'AI_ASSISTANT', // Or a dedicated system ID
            senderEmail: 'assistant@predictpro.com',
            createdAt: serverTimestamp(),
        });
        return { success: true, messageId: newDoc.id };
    } catch (error) {
        console.error("Failed to create broadcast:", error);
        return { success: false };
    }
}


export async function updateUserRole({ email, newRole }: { email: string, newRole: 'User' | 'Assistant' | 'Admin' | 'SuperAdmin' }) {
    try {
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where('email', '==', email), limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return { success: false, message: `User with email ${email} not found.` };
        }

        const userDoc = snapshot.docs[0];
        await updateDoc(userDoc.ref, { role: newRole });

        return { success: true, message: `Successfully updated ${email} to role: ${newRole}.` };
    } catch (error: any) {
        return { success: false, message: `Failed to update role: ${error.message}` };
    }
}


export async function suspendUser({ email, suspend }: { email: string, suspend: boolean }) {
     try {
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where('email', '==', email), limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return { success: false, message: `User with email ${email} not found.` };
        }

        const userDoc = snapshot.docs[0];
        await updateDoc(userDoc.ref, { isSuspended: suspend });

        return { success: true, message: `Successfully ${suspend ? 'suspended' : 're-activated'} ${email}.` };
    } catch (error: any) {
        return { success: false, message: `Failed to update user status: ${error.message}` };
    }
}


const gamePlans = [
    { id: 'vip-slip', name: 'VIP Slip', rounds: 100 },
    { id: 'aviator', name: 'Aviator', rounds: 100 },
    { id: 'crash', name: 'Crash', rounds: 100 },
    { id: 'mines-gems', name: 'Mines & Gems', rounds: 100 }
];

export async function activateLicenseForUser({ email, gameId }: { email: string, gameId: 'vip-slip' | 'aviator' | 'crash' | 'mines-gems' }) {
     try {
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where('email', '==', email), limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return { success: false, message: `User with email ${email} not found.` };
        }

        const userDoc = snapshot.docs[0];
        const userId = userDoc.id;

        const gamePlan = gamePlans.find(g => g.id === gameId);
        if (!gamePlan) {
            return { success: false, message: 'Invalid game ID provided.' };
        }

        const licenseId = `${gamePlan.id}-${userId}`;
        const licenseRef = doc(firestore, 'users', userId, 'user_licenses', licenseId);

        const licensePayload = {
            id: licenseId,
            userId: userId,
            gameType: gamePlan.name,
            roundsRemaining: gamePlan.rounds,
            paymentVerified: true,
            isActive: true,
            createdAt: serverTimestamp(),
        };

        await setDoc(licenseRef, licensePayload);

        return { success: true, message: `Successfully activated ${gamePlan.name} license for ${email}.` };
    } catch (error: any) {
        return { success: false, message: `Failed to activate license: ${error.message}` };
    }
}
