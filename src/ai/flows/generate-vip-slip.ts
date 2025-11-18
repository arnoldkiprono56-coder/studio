'use server';
/**
 * @fileOverview A Genkit flow for generating VIP slips for 1xBet.
 *
 * - generateVipSlip - A function that generates a VIP slip with 3-5 matches.
 * - GenerateVipSlipInput - The input type for the generateVipSlip function.
 * - GenerateVipSlipOutput - The return type for the generateVipSlip function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const MatchSchema = z.object({
  teams: z.string().describe('The two teams playing, e.g., "Team A vs Team B".'),
  market: z.string().describe('The specific 1xBet market for the prediction (e.g., "Total Over 2.5", "1X").'),
  prediction: z.string().describe('The prediction for the market (e.g., "Over 2.5", "Home or Draw").'),
  odd: z.number().min(1.2).max(3.0).describe('The betting odd, between 1.20 and 3.00.'),
});

const GenerateVipSlipInputSchema = z.object({
  userId: z.string().describe('The ID of the user requesting the slip.'),
  licenseId: z.string().describe('The license ID being used for this request.'),
});
export type GenerateVipSlipInput = z.infer<typeof GenerateVipSlipInputSchema>;

const GenerateVipSlipOutputSchema = z.object({
  matches: z.array(MatchSchema).min(3).max(5).describe('An array of 3 to 5 matches for the VIP slip.'),
  slipType: z.string().default("Premium AI VIP").describe('The type of the slip.'),
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
  prompt: `You are the Prediction Engine for PredictPro, and you are HARD-LOCKED to the 1xBet platform. You MUST NOT generate predictions for any other platform.

ACCURACY POLICY: You MUST NEVER claim "guaranteed wins", "100% accuracy", "fixed matches", or "sure bets". All predictions are estimations based on pattern analysis and may not always be correct.

Generate a VIP slip containing 3 to 5 high-confidence matches.

STRICT RULES FOR SLIP:
- Predictions are exclusively for 1xBet.
- All markets and odds must be realistic and valid for 1xBet.
- Do not use unsafe markets like exact scores. Use markets like "Total Over/Under", "1X2", "Double Chance", "Both Teams to Score".
- Odds for each match must be between 1.20 and 3.00.
- The user ({{userId}}) is consuming one round from their license ({{licenseId}}).

Generate the matches and include the mandatory disclaimer: "⚠ Predictions are approximations and not guaranteed." The output must be a JSON object that strictly conforms to the output schema.`,
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
