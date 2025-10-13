
import {NextRequest, NextResponse} from 'next/server';
import {initializeApp, getApp, App, getApps} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {credential} from 'firebase-admin';

// Keep a cached instance of the admin app.
let adminApp: App;

/**
 * Initializes the Firebase Admin SDK, reusing the app instance if it already exists.
 * This is the standard pattern for serverless environments like Next.js API routes.
 */
function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }
  
  // Use Application Default Credentials which are automatically
  // available in the App Hosting environment.
  adminApp = initializeApp({
    credential: credential.applicationDefault(),
  });
  return adminApp;
}


export async function POST(req: NextRequest) {
  try {
    const {uid} = await req.json();
    
    if (!uid) {
      return NextResponse.json({error: 'UID is required'}, {status: 400});
    }

    const app = getAdminApp();

    // Set custom user claims on the server.
    await getAuth(app).setCustomUserClaims(uid, {role: 'Admin'});

    return NextResponse.json({message: `Success! Custom claim set for ${uid}`});
  } catch (error: any) {
    console.error('Error setting custom claim:', error);
    // Ensure a proper error message is sent back
    const errorMessage = error.message || 'An unknown error occurred while setting the admin claim.';
    return NextResponse.json({error: errorMessage}, {status: 500});
  }
}
