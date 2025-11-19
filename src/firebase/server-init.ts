// IMPORTANT: This file is intended for SERVER-SIDE use only.
// It does not include the 'use client' directive.

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

let app: FirebaseApp;

if (!getApps().length) {
  // When running on the server, we can't rely on the auto-initialization from App Hosting.
  // We must initialize using the config object.
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const firestore = getFirestore(app);

export { firestore };
