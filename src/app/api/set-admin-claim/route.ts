
import {NextRequest, NextResponse} from 'next/server';
import {initializeApp, getApp, App, getApps} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {credential} from 'firebase-admin';

// This function ensures that the Firebase Admin app is initialized only once.
function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }
  
  return initializeApp({
    credential: credential.applicationDefault(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const {uid} = await req.json();
    
    if (!uid) {
      return NextResponse.json({error: 'UID is required'}, {status: 400});
    }

    const adminApp = getAdminApp();

    await getAuth(adminApp).setCustomUserClaims(uid, {role: 'Admin'});

    return NextResponse.json({message: `Success! Custom claim set for ${uid}`});
  } catch (error: any) {
    console.error('Error in set-admin-claim API route:', error, error.stack);
    
    const errorMessage = error.message || 'An unknown error occurred on the server.';
    return NextResponse.json({error: errorMessage}, {status: 500});
  }
}
