import admin from 'firebase-admin';

export function getAdminApp() {
  try {
    if (!admin.apps.length) {
      // Expect GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_ADMIN_CREDENTIALS (JSON) in env
      if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
        const creds = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);
        admin.initializeApp({ credential: admin.credential.cert(creds) });
      } else {
        // This will try to use ADC (Application Default Credentials)
        admin.initializeApp();
      }
    }
    return admin.app();
  } catch (err) {
    console.warn('Admin init failed', err);
    return null;
  }
}
