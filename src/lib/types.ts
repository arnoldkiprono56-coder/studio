export interface License {
    id: string;
    userId: string;
    gameType: string;
    roundsRemaining: number;
    paymentVerified: boolean;
    isActive: boolean;
}

export interface Prediction {
    id: string;
    userId: string;
    licenseId: string;
    gameType: string;
    predictionData: string;
    disclaimer: string;
    timestamp: string;
}
