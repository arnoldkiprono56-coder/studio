export interface License {
    id: string;
    userId: string;
    gameType: string;
    roundsRemaining: number;
    paymentVerified: boolean;
    isActive: boolean;
}
