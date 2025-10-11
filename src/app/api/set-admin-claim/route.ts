
import {NextRequest, NextResponse} from 'next/server';
import {initializeApp, getApp, App} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {credential} from 'firebase-admin';

// Initialize the Firebase Admin SDK
let adminApp: App;
if (!adminApp!) {
  try {
    adminApp = getApp('admin');
  } catch (e) {
    adminApp = initializeApp(
      {
        credential: credential.applicationDefault(),
      },
      'admin'
    );
  }
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
    return NextResponse.json({error: error.message}, {status: 500});
  }
}
