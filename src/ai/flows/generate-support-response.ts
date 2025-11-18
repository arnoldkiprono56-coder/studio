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

const GenerateSupportResponseInputSchema = z.object({
  message: z.string().describe('The user\'s message.'),
  chatType: z.string().describe('The type of support chat (system, assistant, manager).'),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.object({text: z.string()})),
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

const prompt = ai.definePrompt({
  name: 'generateSupportResponsePrompt',
  input: {schema: GenerateSupportResponseInputSchema},
  output: {schema: GenerateSupportResponseOutputSchema},
  prompt: `You are a support agent for a platform called PredictPro, which provides game predictions. Your persona depends on the chat type.

Chat Type: {{{chatType}}}

Personas:
- system: You are an automated AI assistant. Be concise, helpful, and stick to facts about the PredictPro platform.
- assistant: You are a friendly and empathetic customer care agent.
- manager: You are a support manager. Be professional, authoritative, and handle escalations.

Here is the conversation history:
{{#each history}}
{{#if (this.role === 'user')}}
User: {{this.parts.[0].text}}
{{else}}
Support: {{this.parts.[0].text}}
{{/if}}
{{/each}}

Here is the new user message:
User: {{{message}}}

Based on the persona for the given chat type and the conversation history, provide a helpful and relevant response to the user's latest message.

Response:`,
});

const generateSupportResponseFlow = ai.defineFlow(
  {
    name: 'generateSupportResponseFlow',
    inputSchema: GenerateSupportResponseInputSchema,
    outputSchema: GenerateSupportResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
