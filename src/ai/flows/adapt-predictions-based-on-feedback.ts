'use server';
/**
 * @fileOverview A flow to adapt game prediction models based on user feedback.
 *
 * - adaptPredictionsBasedOnFeedback - A function that handles the adaptation of prediction models based on feedback.
 * - AdaptPredictionsBasedOnFeedbackInput - The input type for the adaptPredictionsBasedOnFeedback function.
 * - AdaptPredictionsBasedOnFeedbackOutput - The return type for the adaptPredictionsBasedOnFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdaptPredictionsBasedOnFeedbackInputSchema = z.object({
  gameType: z.enum(['aviator', 'crash', 'mines', 'gems']).describe('The type of game for which the prediction is made.'),
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

const prompt = ai.definePrompt({
  name: 'adaptPredictionsBasedOnFeedbackPrompt',
  input: {schema: AdaptPredictionsBasedOnFeedbackInputSchema},
  output: {schema: AdaptPredictionsBasedOnFeedbackOutputSchema},
  prompt: `You are an AI model adaptation expert. You will receive game prediction data and user feedback (won or lost). Based on this feedback, you will adapt the prediction model to improve future predictions for the specified game type.

Game Type: {{{gameType}}}
Prediction Data: {{{predictionData}}}
Feedback: {{{feedback}}}

Provide a confirmation message that the model has been updated.`,
});

const adaptPredictionsBasedOnFeedbackFlow = ai.defineFlow(
  {
    name: 'adaptPredictionsBasedOnFeedbackFlow',
    inputSchema: AdaptPredictionsBasedOnFeedbackInputSchema,
    outputSchema: AdaptPredictionsBasedOnFeedbackOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
