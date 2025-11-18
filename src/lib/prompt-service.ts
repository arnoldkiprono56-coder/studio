'use server';

import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

const { firestore } = initializeFirebase();

// This is a server-side cache to reduce Firestore reads for prompts.
// In a real production app, you might use a more robust caching solution like Redis.
const promptCache = new Map<string, { content: string; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches a prompt's content from Firestore, with caching.
 * This function is intended for server-side use within Genkit flows.
 * @param promptId The ID of the prompt document in Firestore.
 * @returns The content of the prompt as a string.
 * @throws An error if the prompt is not found.
 */
export async function getPrompt(promptId: string): Promise<string> {
  const cachedItem = promptCache.get(promptId);
  if (cachedItem && Date.now() - cachedItem.timestamp < CACHE_TTL_MS) {
    return cachedItem.content;
  }

  const promptRef = doc(firestore, 'prompts', promptId);
  const promptSnap = await getDoc(promptRef);

  if (!promptSnap.exists()) {
    console.error(`Prompt with ID "${promptId}" not found in Firestore.`);
    // In a real app, you might want to create the prompt here from a default if it doesn't exist.
    // For now, we'll throw an error.
    throw new Error(`Prompt '${promptId}' not found. Please create it in the admin dashboard.`);
  }

  const content = promptSnap.data()?.content;
  if (typeof content !== 'string') {
    throw new Error(`Prompt '${promptId}' has invalid or missing content.`);
  }

  promptCache.set(promptId, { content, timestamp: Date.now() });

  return content;
}

    