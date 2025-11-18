
// This is a standalone script to seed your Firestore database with the default pricing plans.
// You can run this script from your terminal using `npx tsx src/lib/seed-plans.ts`.
// Make sure you have `tsx` installed (`npm install -g tsx`) and are authenticated with Firebase.

import { initializeFirebase } from '../firebase/index';
import { collection, doc, setDoc, getDoc, Firestore } from 'firebase/firestore';
import { config } from 'dotenv';
config(); // Load environment variables

const defaultPlans = [
    {
        id: 'vip-slip',
        name: 'VIP Slip',
        price: 1500,
        currency: 'KES',
        rounds: 100,
    },
    {
        id: 'aviator',
        name: 'Aviator',
        price: 799,
        currency: 'KES',
        rounds: 100,
    },
    {
        id: 'crash',
        name: 'Crash',
        price: 799,
        currency: 'KES',
        rounds: 100,
    },
    {
        id: 'mines-gems',
        name: 'Mines & Gems',
        price: 999,
        currency: 'KES',
        rounds: 100,
    }
];

async function seedPlans(db: Firestore) {
  const plansCollection = collection(db, 'plans');

  for (const plan of defaultPlans) {
    const planRef = doc(plansCollection, plan.id);
    const docSnap = await getDoc(planRef);

    if (!docSnap.exists()) {
      console.log(`Creating plan: ${plan.name}...`);
      await setDoc(planRef, plan);
      console.log(`✅ Plan "${plan.name}" created.`);
    } else {
      console.log(`ℹ️ Plan "${plan.name}" already exists. Skipping.`);
    }
  }
}

async function main() {
    console.log('Initializing Firebase...');
    const { firestore } = initializeFirebase();
    console.log('Firebase initialized. Starting to seed plans...');
    try {
        await seedPlans(firestore);
        console.log('\n🎉 All default plans have been seeded successfully.');
    } catch (error) {
        console.error('\n❌ An error occurred while seeding plans:', error);
        process.exit(1);
    }
    process.exit(0);
}

// Check if GOOGLE_API_KEY is set
if (!process.env.GOOGLE_API_KEY) {
  console.error("Error: GOOGLE_API_KEY environment variable is not set. Please set it in your .env file.");
  process.exit(1);
}

main();
