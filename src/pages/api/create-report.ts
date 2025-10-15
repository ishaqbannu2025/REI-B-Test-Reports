import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { getAdminApp } from './admin-init';
import type admin from 'firebase-admin';
import { putReport } from './_fallback-store';

// Initialize Firebase client SDK
const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const firestore = getFirestore(firebaseApp);
// Do not initialize admin at module load time. We'll attempt to initialize inside the
// request handler so missing ADC/credentials don't crash the server on import.
let adminDb: admin.firestore.Firestore | null = null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    console.warn('[create-report] Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed', method: req.method });
  }

  try {
    const { values, userUid } = req.body || {};
    if (!values || !userUid) {
      console.warn('[create-report] Missing payload', { body: req.body });
      return res.status(400).json({ error: 'Missing required fields', required: ['values', 'userUid'] });
    }

    if (!values.uin) {
      console.warn('[create-report] Missing values.uin', { values });
      return res.status(400).json({ error: 'Missing values.uin' });
    }

    // If admin SDK is available, use it for server-side writes. Initialize lazily so
    // the absence of credentials doesn't throw at module load time.
    try {
      if (!adminDb) {
        const adminApp = getAdminApp();
        // Ensure adminApp appears to be usable (has a projectId). If not, skip admin.
        const projectId = adminApp && (adminApp as any).options && (adminApp as any).options.projectId;
        if (adminApp && projectId) {
          adminDb = adminApp.firestore() as any;
        } else {
          console.warn('[create-report] adminApp present but missing projectId, skipping admin path');
          adminDb = null;
        }
      }
    } catch (err) {
      console.warn('[create-report] Admin init failed (will use fallback)', err);
      adminDb = null;
    }

    if (adminDb) {
      const adminRef = adminDb.collection('users').doc(userUid).collection('testReports').doc(values.uin);
      // Construct a server-timestamp compatible object for admin SDK
      const adminSdk = require('firebase-admin') as typeof import('firebase-admin');
      const reportData = {
        ...values,
        entryDate: adminSdk.firestore.FieldValue.serverTimestamp(),
        enteredBy: userUid,
      } as any;
      await adminRef.set(reportData, { merge: true });
      console.info('[create-report] (admin) Report written', { path: adminRef.path, uin: values.uin });
      return res.status(200).json({ message: 'Report created (admin)', uin: values.uin, path: adminRef.path });
    }

    // No admin credentials: try to use a local fallback store so the app is usable
    // in development without firebase-admin configured. This keeps the API working
    // for demos and tests.
    try {
      const info = putReport(userUid, values.uin, Object.assign({}, values, { entryDate: new Date().toISOString(), enteredBy: userUid }));
      console.info('[create-report] (fallback) Report written', info);
      return res.status(200).json({ message: 'Report created (fallback)', uin: values.uin, path: info.path });
    } catch (err) {
      console.warn('[create-report] admin SDK not initialized and fallback failed', err);
      return res.status(501).json({
        error: 'Server-side creation not available: firebase-admin not initialized and fallback failed. Configure FIREBASE_ADMIN_CREDENTIALS on the server.',
      });
    }
  } catch (error: any) {
    console.error('[create-report] Error', error);
    // Expose minimal debug info but avoid leaking secrets
    return res.status(500).json({ error: String(error?.message || error), debug: { name: error?.name } });
  }
}
