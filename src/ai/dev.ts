import { config } from 'dotenv';
config();

import '@/ai/flows/generate-game-predictions.ts';
import '@/ai/flows/adapt-predictions-based-on-feedback.ts';
import '@/ai/flows/generate-support-response.ts';
