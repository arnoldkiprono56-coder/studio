'use server';
/**
 * @fileOverview A flow to generate responses for the support chat.
 *
 * - generateSupportResponse - A function that handles generating support responses.
 * - GenerateSupportResponseInput - The input type for the generateSupportResponse function.
 * - GenerateSupportResponseOutput - The return type for the generateSupportResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getPrompt } from '@/lib/prompt-service';

const GenerateSupportResponseInputSchema = z.object({
  message: z.string().describe("The user's message."),
  chatType: z.string().describe('The type of support chat (system, assistant, manager).'),
  history: z.array(z.object({
    isUser: z.boolean(),
    text: z.string(),
  })).describe('The conversation history.'),
});
export type GenerateSupportResponseInput = z.infer<typeof GenerateSupportResponseInputSchema>;

const GenerateSupportResponseOutputSchema = z.object({
  response: z.string().describe('The AI-generated response.'),
});
export type GenerateSupportResponseOutput = z.infer<typeof GenerateSupportResponseOutputSchema>;

export async function generateSupportResponse(input: GenerateSupportResponseInput): Promise<GenerateSupportResponseOutput> {
  return generateSupportResponseFlow(input);
}

const generateSupportResponseFlow = ai.defineFlow(
  {
    name: 'generateSupportResponseFlow',
    inputSchema: GenerateSupportResponseInputSchema,
    outputSchema: GenerateSupportResponseOutputSchema,
  },
  async input => {
    const promptText = await getPrompt('generateSupportResponsePrompt');

    const prompt = ai.definePrompt({
      name: 'generateSupportResponsePrompt',
      input: {schema: GenerateSupportResponseInputSchema},
      output: {schema: GenerateSupportResponseOutputSchema},
      prompt: promptText,
    });

    const {output} = await prompt(input);
    return output!;
  }
);

    