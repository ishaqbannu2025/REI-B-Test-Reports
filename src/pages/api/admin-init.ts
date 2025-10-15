
import admin from 'firebase-admin';

export function getAdminApp() {
  try {
    if (!admin.apps.length) {
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Vercel might escape newlines, so we replace \n with \n
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      };

      // Check if all the necessary components of the service account are present
      if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
        console.log('Initializing Firebase Admin with separate environment variables.');
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount as any),
          projectId: serviceAccount.projectId,
        });
      } else if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
        // Fallback to the single JSON variable if the separate ones aren't set
        console.log('Initializing Firebase Admin with FIREBASE_ADMIN_CREDENTIALS.');
        const creds = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);
        admin.initializeApp({ credential: admin.credential.cert(creds) });
      } else {
        // This will try to use Application Default Credentials, which likely won't work in Vercel
        // without extra configuration.
        console.log('Attempting to initialize Firebase Admin with default credentials.');
        admin.initializeApp();
      }
    }
    return admin.app();
  } catch (err) {
    // Log the full error for better debugging in Vercel logs
    console.error('CRITICAL: Firebase Admin initialization failed.', err);
    return null;
  }
}
