let app;
let auth;
let initPromise;

function requireEnv(name) {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(`Missing Firebase config: ${name}`);
  }
  return value;
}

export async function getFirebaseAuth() {
  if (auth) {
    return auth;
  }

  if (!initPromise) {
    initPromise = Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
    ]).then(([appModule, authModule]) => {
      app = appModule.initializeApp({
        apiKey: requireEnv('VITE_FIREBASE_API_KEY'),
        authDomain: requireEnv('VITE_FIREBASE_AUTH_DOMAIN'),
        projectId: requireEnv('VITE_FIREBASE_PROJECT_ID'),
        appId: requireEnv('VITE_FIREBASE_APP_ID'),
      });
      auth = authModule.getAuth(app);
      return auth;
    });
  }

  return initPromise;
}
