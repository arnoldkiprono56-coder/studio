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

const GenerateGamePredictionsInputSchema = z.object({
  gameType: z
    .enum(['aviator', 'crash', 'gems-mines'])
    .describe('The type of game for which to generate predictions.'),
  userId: z.string().describe('The ID of the user requesting the prediction.'),
});
export type GenerateGamePredictionsInput = z.infer<typeof GenerateGamePredictionsInputSchema>;

const GenerateGamePredictionsOutputSchema = z.object({
  predictionData: z.object({
    multiplier: z.number().optional().describe('The predicted multiplier for Aviator game.'),
    crashPoint: z.number().optional().describe('The predicted crash point for Crash game.'),
    safeTiles: z.array(z.number()).optional().describe('An array of indices for safe tiles in Gems & Mines.'),
    gemLocations: z.array(z.number()).optional().describe('An array of indices for gem locations in Gems & Mines.'),
  }).describe('The prediction data for the specified game. Contains game-specific fields.'),
  confidenceScore: z.number().describe('The confidence score of the prediction.'),
  volatilityAssessment: z.string().describe('The volatility assessment for the game.'),
});
export type GenerateGamePredictionsOutput = z.infer<typeof GenerateGamePredictionsOutputSchema>;

export async function generateGamePredictions(
  input: GenerateGamePredictionsInput
): Promise<GenerateGamePredictionsOutput> {
  return generateGamePredictionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateGamePredictionsPrompt',
  input: {schema: GenerateGamePredictionsInputSchema},
  output: {schema: GenerateGamePredictionsOutputSchema},
  prompt: `You are an expert gaming analyst specializing in the "1xBet" platform. Based on the game type provided, generate a prediction for the corresponding game on 1xBet.

Game Type: {{{gameType}}}
User ID: {{{userId}}}

Provide predictionData, confidenceScore, and volatilityAssessment. The predictionData is game-specific and contains values important in that game on 1xBet.
- For 'aviator', provide a 'multiplier'.
- For 'crash', provide a 'crashPoint'.
- For 'gems-mines', provide 'safeTiles' and 'gemLocations' as arrays of tile indices.
Make sure the predictionData conforms to the output JSON schema.
`,
});

const generateGamePredictionsFlow = ai.defineFlow(
  {
    name: 'generateGamePredictionsFlow',
    inputSchema: GenerateGamePredictionsInputSchema,
    outputSchema: GenerateGamePredictionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
