
'use server';
/**
 * @fileOverview This flow resolves the outcome of a VIP slip, updates its status, and refunds the user a round if the slip was lost.
 *
 * - resolveVipSlipOutcome - The main function to resolve a VIP slip.
 * - ResolveVipSlipOutcomeInput - The input type for the function.
 * - ResolveVipSlipOutcomeOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { firestore } from '@/firebase/server-init';
import { doc, getDoc, updateDoc, increment, serverTimestamp, addDoc, collection } from 'firebase/firestore';

const ResolveVipSlipOutcomeInputSchema = z.object({
  predictionId: z.string().describe('The ID of the prediction document to resolve.'),
  userId: z.string().describe('The ID of the user who owns the prediction.'),
  outcome: z.enum(['won', 'lost']).describe('The final outcome of the VIP slip.'),
});
export type ResolveVipSlipOutcomeInput = z.infer<typeof ResolveVipSlipOutcomeInputSchema>;

const ResolveVipSlipOutcomeOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type ResolveVipSlipOutcomeOutput = z.infer<typeof ResolveVipSlipOutcomeOutputSchema>;

export async function resolveVipSlipOutcome(input: ResolveVipSlipOutcomeInput): Promise<ResolveVipSlipOutcomeOutput> {
  return resolveVipSlipOutcomeFlow(input);
}

const resolveVipSlipOutcomeFlow = ai.defineFlow(
  {
    name: 'resolveVipSlipOutcomeFlow',
    inputSchema: ResolveVipSlipOutcomeInputSchema,
    outputSchema: ResolveVipSlipOutcomeOutputSchema,
  },
  async ({ predictionId, userId, outcome }) => {
    try {
      const predictionRef = doc(firestore, 'users', userId, 'predictions', predictionId);
      const predictionSnap = await getDoc(predictionRef);

      if (!predictionSnap.exists()) {
        throw new Error('Prediction not found.');
      }

      const prediction = predictionSnap.data();

      // 1. Update the prediction status
      await updateDoc(predictionRef, {
        status: outcome,
        resolvedAt: serverTimestamp(),
      });

      // 2. If lost, refund the round and send a notification
      if (outcome === 'lost' && prediction.licenseId) {
        const licenseRef = doc(firestore, 'users', userId, 'user_licenses', prediction.licenseId);
        
        // Use increment to safely add a round back
        await updateDoc(licenseRef, {
          roundsRemaining: increment(1),
          isActive: true, // Ensure license is active again if it expired due to this round
        });

        // 3. Create a notification for the user
        const notificationMessage = `Yesterday's VIP slip was not successful. As a token of our commitment, we have refunded your used round.`;
        const notificationsRef = collection(firestore, 'notifications');
        await addDoc(notificationsRef, {
            message: notificationMessage,
            targetAudience: 'user', // Specific to one user
            userId: userId,
            senderId: 'SYSTEM',
            senderEmail: 'support@predictpro.com',
            createdAt: serverTimestamp(),
        });

        return {
          success: true,
          message: `Prediction ${predictionId} marked as 'lost'. User's round has been refunded and they have been notified.`,
        };
      }

      return {
        success: true,
        message: `Prediction ${predictionId} marked as '${outcome}'. No refund necessary.`,
      };

    } catch (error: any) {
      console.error("Error in resolveVipSlipOutcomeFlow: ", error);
      return {
        success: false,
        message: error.message || 'An unexpected error occurred.',
      };
    }
  }
);

    