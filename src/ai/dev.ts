import { config } from 'dotenv';
config();

import '@/ai/flows/generate-game-predictions';
import '@/ai/flows/adapt-predictions-based-on-feedback';
import '@/ai/flows/generate-support-response';
import '@/ai/flows/generate-vip-slip';
