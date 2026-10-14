import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

let isFirebaseConfigured = false;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH && fs.existsSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)) {
    const serviceAccount = JSON.parse(fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    isFirebaseConfigured = true;
    console.log('[Firebase Admin] Initialized with service account file.');
  } else if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    isFirebaseConfigured = true;
    console.log('[Firebase Admin] Initialized with environment credentials.');
  } else {
    console.warn('[Firebase Admin] Credentials not found in environment.');
    console.warn('[Firebase Admin] Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in server/.env for production.');
  }
} catch (error) {
  console.error('[Firebase Admin] Initialization error:', error.message);
}

export const getFirebaseAdmin = () => admin;
export const isFirebaseAuthReady = () => isFirebaseConfigured;
export default admin;
