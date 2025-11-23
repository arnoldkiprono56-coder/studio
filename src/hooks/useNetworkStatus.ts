
'use client';

import { useState, useEffect } from 'react';

type ConnectionType = 'bluetooth' | 'cellular' | 'ethernet' | 'none' | 'wifi' | 'wimax' | 'other' | 'unknown';

interface NetworkStatus {
    isCellular: boolean;
    isOnline: boolean;
    isLoading: boolean;
}

// Extend the Navigator interface to include the experimental 'connection' property.
declare global {
    interface Navigator {
        connection?: {
            type: ConnectionType;
            addEventListener: (event: 'change', listener: () => void) => void;
            removeEventListener: (event: 'change', listener: () => void) => void;
        };
    }
}

export function useNetworkStatus(): NetworkStatus {
    const [status, setStatus] = useState<NetworkStatus>({
        isCellular: false,
        isOnline: true,
        isLoading: true,
    });

    useEffect(() => {
        const getStatus = () => {
            const isOnline = navigator.onLine;
            // The Network Information API is experimental.
            // If it's not available, we can't determine the connection type,
            // so we default isCellular to false as a safe fallback.
            const connection = navigator.connection;
            const isCellular = connection ? connection.type === 'cellular' : false;

            setStatus({ isCellular, isOnline, isLoading: false });
        };

        getStatus(); // Get initial status

        // Set up listeners for changes
        const connection = navigator.connection;
        window.addEventListener('online', getStatus);
        window.addEventListener('offline', getStatus);
        if (connection) {
            connection.addEventListener('change', getStatus);
        }

        // Cleanup
        return () => {
            window.removeEventListener('online', getStatus);
            window.removeEventListener('offline', getStatus);
            if (connection) {
                connection.removeEventListener('change', getStatus);
            }
        };
    }, []);

    return status;
}
