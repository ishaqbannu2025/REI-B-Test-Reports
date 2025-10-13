
import {NextRequest, NextResponse} from 'next/server';
import {initializeApp, getApp, App, getApps} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {credential} from 'firebase-admin';

// Initialize a global promise to prevent re-initialization
let adminAppPromise: Promise<App> | null = null;

const initializeAdminApp = (): Promise<App> => {
  if (!adminAppPromise) {
    adminAppPromise = new Promise((resolve) => {
       // Check if the 'admin' app is already initialized.
       const existingApp = getApps().find(app => app.name === 'admin');
       if (existingApp) {
         resolve(existingApp);
       } else {
         // If not initialized, create a new 'admin' app instance.
         resolve(initializeApp(
          {
            // Use Application Default Credentials which are automatically
            // available in the App Hosting environment.
            credential: credential.applicationDefault(),
          },
          'admin' // Name the app 'admin' to avoid conflicts.
        ));
       }
    });
  }
  return adminAppPromise;
};


export async function POST(req: NextRequest) {
  try {
    const {uid} = await req.json();
    
    if (!uid) {
      return NextResponse.json({error: 'UID is required'}, {status: 400});
    }

    const adminApp = await initializeAdminApp();

    // Set custom user claims on the server.
    await getAuth(adminApp).setCustomUserClaims(uid, {role: 'Admin'});

    return NextResponse.json({message: `Success! Custom claim set for ${uid}`});
  } catch (error: any) {
    console.error('Error setting custom claim:', error);
    // Ensure a proper error message is sent back
    const errorMessage = error.message || 'An unknown error occurred while setting the admin claim.';
    return NextResponse.json({error: errorMessage}, {status: 500});
  }
}
