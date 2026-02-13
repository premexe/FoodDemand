import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

let app;
let auth;

function requireEnv(name) {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(`Missing Firebase config: ${name}`);
  }
  return value;
}

export function getFirebaseAuth() {
  if (auth) {
    return auth;
  }

  app = initializeApp({
    apiKey: requireEnv('VITE_FIREBASE_API_KEY'),
    authDomain: requireEnv('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: requireEnv('VITE_FIREBASE_PROJECT_ID'),
    appId: requireEnv('VITE_FIREBASE_APP_ID'),
  });
  auth = getAuth(app);
  return auth;
}

