'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating game predictions for the 1xBet platform.
 *
 * - generateGamePredictions - A function that generates predictions for a specified game on 1xBet.
 * - GenerateGamePredictionsInput - The input type for the generateGamepredictions function.
 * - GenerateGamePredictionsOutput - The return type for the generateGamepredictions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getPrompt } from '@/lib/prompt-service';

const GenerateGamePredictionsInputSchema = z.object({
  gameType: z
    .enum(['aviator', 'crash', 'gems-mines'])
    .describe('The type of game for which to generate predictions.'),
  userId: z.string().describe('The ID of the user requesting the prediction.'),
});
export type GenerateGamePredictionsInput = z.infer<typeof GenerateGamePredictionsInputSchema>;

const AviatorPredictionSchema = z.object({
  targetMultiplier: z.string().describe('The predicted cashout multiplier range for Aviator, e.g., "2.3x – 4.8x".'),
  riskLevel: z.string().describe('The risk level of the prediction (e.g., Medium).'),
  confidence: z.number().describe('The confidence score of the prediction as a percentage (e.g., 71).'),
});

const CrashPredictionSchema = z.object({
    targetCashout: z.string().describe('The predicted cashout point for Crash, e.g., "2.3x – 4.8x".'),
    riskLevel: z.string().describe('The risk level of the prediction (e.g., Medium).'),
    roundConfidence: z.number().describe('The confidence score of the prediction as a percentage (eg., 71).'),
});

const GemsMinesPredictionSchema = z.object({
    safeTiles: z.number().describe('The number of safe tiles.'),
    avoidTiles: z.number().describe('The number of tiles to avoid.'),
    pattern: z.string().describe('The recommended pattern type.'),
    risk: z.string().describe('The risk level (Low, Medium, or High).'),
});


const GenerateGamePredictionsOutputSchema = z.object({
  predictionData: z.union([AviatorPredictionSchema, CrashPredictionSchema, GemsMinesPredictionSchema]).describe('The game-specific prediction data.'),
  disclaimer: z.string().default('⚠ Predictions are approximations and not guaranteed.'),
});
export type GenerateGamePredictionsOutput = z.infer<typeof GenerateGamePredictionsOutputSchema>;

export async function generateGamePredictions(
  input: GenerateGamePredictionsInput
): Promise<GenerateGamePredictionsOutput> {
  return generateGamePredictionsFlow(input);
}

const generateGamePredictionsFlow = ai.defineFlow(
  {
    name: 'generateGamePredictionsFlow',
    inputSchema: GenerateGamePredictionsInputSchema,
    outputSchema: GenerateGamePredictionsOutputSchema,
  },
  async input => {
    const promptText = await getPrompt('generateGamePredictionsPrompt');

    const prompt = ai.definePrompt({
      name: 'generateGamePredictionsPrompt',
      input: {schema: GenerateGamePredictionsInputSchema},
      output: {schema: GenerateGamePredictionsOutputSchema},
      prompt: promptText,
    });
    
    const {output} = await prompt(input);
    return output!;
  }
);

    