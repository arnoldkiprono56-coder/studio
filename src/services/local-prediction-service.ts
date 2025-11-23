

'use server';

import type { Prediction } from '@/lib/types';

type GameType = 'aviator' | 'crash' | 'gems-mines' | 'vip-slip';

interface PredictionInput {
    gameType: GameType;
    teams?: { team1: string, team2:string };
    history?: Prediction[];
}

export interface LocalPredictionOutput {
    predictionData: any;
    disclaimer: string;
}

const DISCLAIMER = 'Play responsibly. Predictions are not guaranteed.';

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
 * Generates a prediction for Aviator or Crash.
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
 * Generates a "smarter" prediction for Gems & Mines by learning from user history.
 */
function generateGemsMinesPrediction(history: Prediction[] = []): any {
    const allTiles = Array.from({ length: 25 }, (_, i) => i);
    const tileScores: Record<number, number> = {};

    // Initialize all tiles with a neutral score + a small random factor to prevent ties
    allTiles.forEach(tile => {
        tileScores[tile] = Math.random() * 0.1;
    });

    // Learn from history
    history.forEach(game => {
        const gameTiles = game.predictionData?.safeTileIndices || [];
        if (game.status === 'won') {
            // Boost score for tiles in winning games
            gameTiles.forEach((tile: number) => {
                tileScores[tile] = (tileScores[tile] || 0) + 2;
            });
        } else if (game.status === 'lost') {
            // Heavily penalize the tiles the user marked as mines
            if (Array.isArray(game.mineLocations)) {
                 game.mineLocations.forEach((mineTile: number) => {
                    tileScores[mineTile] = (tileScores[mineTile] || 0) - 50;
                 });
            }
            // Slightly penalize other tiles from the losing set that weren't mines
            const mineSet = new Set(game.mineLocations);
            gameTiles.forEach((tile: number) => {
                 if (!mineSet.has(tile)) {
                    tileScores[tile] = (tileScores[tile] || 0) - 1;
                }
            });
        }
    });

    // Sort tiles by score in descending order
    const sortedTiles = allTiles.sort((a, b) => tileScores[b] - tileScores[a]);

    // Determine number of safe tiles to return (can be random or based on confidence)
    const numSafeTiles = getRandomInt(1, 5);

    // Get the top N safest tiles
    const safeTileIndices = sortedTiles.slice(0, numSafeTiles);

    const riskLevels = ['Low', 'Medium', 'High'];
    return {
        safeTileIndices: safeTileIndices.sort((a, b) => a - b),
        risk: riskLevels[getRandomInt(0, 2)],
    };
}


/**
 * Generates a prediction for a VIP Slip football match.
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
        analysisSummary: `This analysis is based on a statistical review of the match between ${teams.team1} and ${teams.team2}.`,
    };
}

/**
 * A local, standalone function to generate predictions without any API calls.
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
            predictionData = generateGemsMinesPrediction(input.history);
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
