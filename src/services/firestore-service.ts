'use server';

import { firestore } from '@/firebase/server-init';
import { collection, getDocs, query, where, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';

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
    const users = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            email: data.email,
            role: data.role,
            createdAt: data.createdAt,
        };
    });
    return { users };
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
    const logs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            userId: data.userId,
            action: data.action,
            details: data.details,
            timestamp: data.timestamp,
        };
    });
    return { logs };
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
