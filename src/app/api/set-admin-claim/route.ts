
import {NextRequest, NextResponse} from 'next/server';
import {initializeApp, getApp, App, deleteApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {credential} from 'firebase-admin';

let adminApp: App;

// Initialize the Firebase Admin SDK only once.
if (!getApps().some(app => app.name === 'admin')) {
  adminApp = initializeApp(
    {
      // Use Application Default Credentials
      credential: credential.applicationDefault(),
    },
    'admin'
  );
} else {
  adminApp = getApp('admin');
}


export async function POST(req: NextRequest) {
  try {
    const {uid} = await req.json();
    
    if (!uid) {
      return NextResponse.json({error: 'UID is required'}, {status: 400});
    }

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
