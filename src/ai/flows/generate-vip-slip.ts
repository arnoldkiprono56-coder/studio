'use server';
/**
 * @fileOverview A Genkit flow for generating VIP slips for 1xBet.
 *
 * - generateVipSlip - A function that generates a VIP slip with 3-5 matches.
 * - GenerateVipSlipInput - The input type for the generateVipSlip function.
 * - GenerateVipSlipOutput - The return type for the generateVipSlip function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MatchSchema = z.object({
  teams: z.string().describe('The two teams playing, e.g., "Team A vs Team B".'),
  market: z.string().describe('The specific 1xBet market for the prediction.'),
  prediction: z.string().describe('The prediction for the market.'),
  odd: z.number().min(1.2).max(3.0).describe('The betting odd, between 1.20 and 3.00.'),
});

export const GenerateVipSlipInputSchema = z.object({
  userId: z.string().describe('The ID of the user requesting the slip.'),
  licenseId: z.string().describe('The license ID being used for this request.'),
});
export type GenerateVipSlipInput = z.infer<typeof GenerateVipSlipInputSchema>;

export const GenerateVipSlipOutputSchema = z.object({
  matches: z.array(MatchSchema).min(3).max(5).describe('An array of 3 to 5 matches for the VIP slip.'),
  disclaimer: z.string().default('⚠ Predictions are approximations and not guaranteed.'),
});
export type GenerateVipSlipOutput = z.infer<typeof GenerateVipSlipOutputSchema>;

export async function generateVipSlip(input: GenerateVipSlipInput): Promise<GenerateVipSlipOutput> {
  return generateVipSlipFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateVipSlipPrompt',
  input: { schema: GenerateVipSlipInputSchema },
  output: { schema: GenerateVipSlipOutputSchema },
  prompt: `You are the Prediction Engine for PredictPro, locked to the 1xBet platform.
Generate a VIP slip containing 3 to 5 high-confidence matches.

RULES:
- Predictions are exclusively for 1xBet.
- All markets and odds must be realistic for 1xBet.
- Do not use unsafe markets like exact scores.
- The user ({{userId}}) is consuming one round from their license ({{licenseId}}).

Generate the matches and include the mandatory disclaimer.`,
});

const generateVipSlipFlow = ai.defineFlow(
  {
    name: 'generateVipSlipFlow',
    inputSchema: GenerateVipSlipInputSchema,
    outputSchema: GenerateVipSlipOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
