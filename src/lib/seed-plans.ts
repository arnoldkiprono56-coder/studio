
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

const defaultGameStatuses = [
    {
        id: 'vip-slip',
        name: 'VIP Slip',
        isEnabled: true,
        disabledReason: ''
    },
    {
        id: 'aviator',
        name: 'Aviator',
        isEnabled: true,
        disabledReason: ''
    },
    {
        id: 'crash',
        name: 'Crash',
        isEnabled: true,
        disabledReason: ''
    },
    {
        id: 'mines-gems',
        name: 'Mines & Gems',
        isEnabled: true,
        disabledReason: ''
    }
]

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

async function seedGameStatuses(db: Firestore) {
    const gameStatusCollection = collection(db, 'game_status');
  
    for (const status of defaultGameStatuses) {
      const statusRef = doc(gameStatusCollection, status.id);
      const docSnap = await getDoc(statusRef);
  
      if (!docSnap.exists()) {
        console.log(`Creating game status: ${status.name}...`);
        await setDoc(statusRef, status);
        console.log(`✅ Game status "${status.name}" created.`);
      } else {
        console.log(`ℹ️ Game status "${status.name}" already exists. Skipping.`);
      }
    }
}

async function main() {
    console.log('Initializing Firebase...');
    const { firestore } = initializeFirebase();
    console.log('Firebase initialized. Starting to seed data...');
    try {
        await seedPlans(firestore);
        await seedGameStatuses(firestore);
        console.log('\n🎉 All default data has been seeded successfully.');
    } catch (error) {
        console.error('\n❌ An error occurred while seeding:', error);
        process.exit(1);
    }
    process.exit(0);
}

// This script needs a GOOGLE_API_KEY to run from the command line
// It uses a separate initialization path than the web app.
if (!process.env.GOOGLE_API_KEY && !process.env.GCLOUD_PROJECT) {
  console.error("Error: GOOGLE_API_KEY or GCLOUD_PROJECT environment variable is not set. Please set it in your .env file to run seeding scripts.");
  process.exit(1);
}

main();

    