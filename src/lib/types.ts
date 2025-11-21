
export interface License {
    id: string;
    userId: string;
    gameType: string;
    roundsRemaining: number;
    isActive: boolean;
    createdAt?: any;
}

export interface Prediction {
    id: string;
    userId: string;
    licenseId: string;
    gameType: string;
    predictionData: any; // Can be string or object
    disclaimer: string;
    timestamp: any; // Can be Date or Firestore Timestamp
    status: 'pending' | 'won' | 'lost';
}
