
import {NextRequest, NextResponse} from 'next/server';
import {initializeApp, getApp, App, getApps} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {credential} from 'firebase-admin';

// This is the standard pattern for initializing the Firebase Admin SDK in a serverless environment.
// It ensures that the app is initialized only once per function instance.
function getAdminApp(): App {
  if (getApps().length) {
    return getApp();
  }
  
  return initializeApp({
    // Use Application Default Credentials which are automatically
    // available in the App Hosting environment.
    credential: credential.applicationDefault(),
  });
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
