
'use server';

type GameType = 'aviator' | 'crash' | 'gems-mines' | 'vip-slip';

interface PredictionInput {
    gameType: GameType;
    teams?: { team1: string, team2: string };
}

export interface LocalPredictionOutput {
    predictionData: any;
    disclaimer: string;
}

const DISCLAIMER = '⚠️ These predictions are randomly generated for demonstration purposes and are not guaranteed. Play responsibly.';

/**
 * Generates a random integer between min and max (inclusive).
 */
function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates a random float between min and max.
 */
function getRandomFloat(min: number, max: number, decimals: number): number {
    const str = (Math.random() * (max - min) + min).toFixed(decimals);
    return parseFloat(str);
}

/**
 * Generates a random prediction for Aviator or Crash.
 */
function generateMultiplierPrediction(): any {
    const riskLevels = ['Low', 'Medium', 'High'];
    return {
        targetCashout: `${getRandomFloat(1.1, 12.0, 2)}x`,
        riskLevel: riskLevels[getRandomInt(0, 2)],
        confidence: getRandomInt(30, 95),
    };
}

/**
 * Generates a random prediction for Gems & Mines.
 */
function generateGemsMinesPrediction(): any {
    const numSafeTiles = getRandomInt(1, 5);
    const safeTileIndices: number[] = [];
    while (safeTileIndices.length < numSafeTiles) {
        const tile = getRandomInt(0, 24);
        if (!safeTileIndices.includes(tile)) {
            safeTileIndices.push(tile);
        }
    }
    
    const riskLevels = ['Low', 'Medium', 'High'];
    return {
        safeTileIndices: safeTileIndices.sort((a, b) => a - b),
        risk: riskLevels[getRandomInt(0, 2)],
    };
}

/**
 * Generates a random prediction for a VIP Slip football match.
 */
function generateVipSlipPrediction(teams: { team1: string, team2: string }): any {
    const markets = [
        `Total Over ${getRandomFloat(0.5, 4.5, 1)}`,
        `Total Under ${getRandomFloat(1.5, 5.5, 1)}`,
        '1X2',
        'Double Chance',
        'Both Teams to Score',
    ];
    const predictions = ['Home Win', 'Away Win', 'Draw', 'Yes', 'No', '1X', 'X2', '12'];
    
    return {
        teams: `${teams.team1} vs ${teams.team2}`,
        market: markets[getRandomInt(0, markets.length - 1)],
        prediction: predictions[getRandomInt(0, predictions.length - 1)],
        confidence: getRandomInt(50, 95),
        analysisSummary: `This is a randomly generated analysis for the match between ${teams.team1} and ${teams.team2}. Because API dependencies were removed, this prediction does not use a real AI model.`,
    };
}

/**
 * A local, standalone function to generate random predictions without any API calls.
 * @param input - The prediction input specifying the game type.
 * @returns A prediction output object.
 */
export async function generateLocalPrediction(input: PredictionInput): Promise<LocalPredictionOutput> {
    let predictionData: any;

    switch (input.gameType) {
        case 'aviator':
            predictionData = generateMultiplierPrediction();
            break;
        case 'crash':
            predictionData = generateMultiplierPrediction();
            break;
        case 'gems-mines':
            predictionData = generateGemsMinesPrediction();
            break;
        case 'vip-slip':
            if (!input.teams) {
                throw new Error('Team names are required for a VIP slip prediction.');
            }
            predictionData = generateVipSlipPrediction(input.teams);
            break;
        default:
            throw new Error(`Unsupported game type: ${input.gameType}`);
    }

    return {
        predictionData,
        disclaimer: DISCLAIMER,
    };
}
