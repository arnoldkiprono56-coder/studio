'use server';
/**
 * @fileOverview A flow to adapt game prediction models based on user feedback for games on the 1xBet platform.
 *
 * - adaptPredictionsBasedOnFeedback - A function that handles the adaptation of prediction models based on feedback.
 * - AdaptPredictionsBasedOnFeedbackInput - The input type for the adaptPredictionsBasedOnFeedback function.
 * - AdaptPredictionsBasedOnFeedbackOutput - The return type for the adaptPredictionsBasedOnFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getPrompt } from '@/lib/prompt-service';

const AdaptPredictionsBasedOnFeedbackInputSchema = z.object({
  gameType: z.enum(['aviator', 'crash', 'gems-mines', 'vip-slip']).describe('The type of game for which the prediction is made.'),
  predictionData: z.string().describe('The prediction data that was provided to the user.'),
  feedback: z.enum(['won', 'lost']).describe('The feedback provided by the user on the prediction.'),
});
export type AdaptPredictionsBasedOnFeedbackInput = z.infer<typeof AdaptPredictionsBasedOnFeedbackInputSchema>;

const AdaptPredictionsBasedOnFeedbackOutputSchema = z.object({
  modelUpdateConfirmation: z.string().describe('Confirmation that the model has been updated based on the feedback.'),
});
export type AdaptPredictionsBasedOnFeedbackOutput = z.infer<typeof AdaptPredictionsBasedOnFeedbackOutputSchema>;

export async function adaptPredictionsBasedOnFeedback(input: AdaptPredictionsBasedOnFeedbackInput): Promise<AdaptPredictionsBasedOnFeedbackOutput> {
  return adaptPredictionsBasedOnFeedbackFlow(input);
}

const adaptPredictionsBasedOnFeedbackFlow = ai.defineFlow(
  {
    name: 'adaptPredictionsBasedOnFeedbackFlow',
    inputSchema: AdaptPredictionsBasedOnFeedbackInputSchema,
    outputSchema: AdaptPredictionsBasedOnFeedbackOutputSchema,
  },
  async input => {
    const promptText = await getPrompt('adaptPredictionsBasedOnFeedbackPrompt');
    
    const prompt = ai.definePrompt({
      name: 'adaptPredictionsBasedOnFeedbackPrompt',
      input: {schema: AdaptPredictionsBasedOnFeedbackInputSchema},
      output: {schema: AdaptPredictionsBasedOnFeedbackOutputSchema},
      prompt: promptText,
    });

    const {output} = await prompt(input);
    return output!;
  }
);

    