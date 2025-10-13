
import {NextRequest, NextResponse} from 'next/server';
import {initializeApp, getApp, App, getApps} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {credential} from 'firebase-admin';

// This function ensures that the Firebase Admin app is initialized only once.
function getAdminApp(): App {
  // If there are already initialized apps, return the default one.
  if (getApps().length > 0) {
    return getApp();
  }
  
  // Otherwise, initialize a new app with Application Default Credentials.
  // This is the standard and recommended way for server-side environments like App Hosting.
  return initializeApp({
    credential: credential.applicationDefault(),
  });
}

export async function POST(req: NextRequest) {
  try {
    // Get the initialized Admin App instance *before* doing anything else.
    const app = getAdminApp();

    const {uid} = await req.json();
    
    if (!uid) {
      return NextResponse.json({error: 'UID is required'}, {status: 400});
    }

    // Use the app instance to get the Auth service and set the custom claim.
    await getAuth(app).setCustomUserClaims(uid, {role: 'Admin'});

    return NextResponse.json({message: `Success! Custom claim set for ${uid}`});
  } catch (error: any) {
    // Log the detailed error on the server for debugging.
    console.error('Error in set-admin-claim API route:', error);
    
    // Send a generic but helpful error message back to the client.
    const errorMessage = error.message || 'An unknown error occurred on the server.';
    return NextResponse.json({error: errorMessage}, {status: 500});
  }
}
