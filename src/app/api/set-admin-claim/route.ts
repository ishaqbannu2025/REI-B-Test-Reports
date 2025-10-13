
import {NextRequest, NextResponse} from 'next/server';
import {initializeApp, getApp, App, deleteApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {credential} from 'firebase-admin';

// Initialize the Firebase Admin SDK
async function getAdminApp(): Promise<App> {
    try {
        // This will throw if the app doesn't exist.
        return getApp('admin');
    } catch (e) {
        // If the app doesn't exist, initialize it.
        return initializeApp(
          {
            // Use Application Default Credentials
            credential: credential.applicationDefault(),
          },
          'admin'
        );
    }
}


export async function POST(req: NextRequest) {
  let adminApp;
  try {
    const {uid} = await req.json();
    
    if (!uid) {
      return NextResponse.json({error: 'UID is required'}, {status: 400});
    }

    // Get (or initialize) the admin app instance
    adminApp = await getAdminApp();

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
