import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collectionGroup,
  query,
  where,
  getDocs,
  collection,
  getDoc,
  doc,
  limit,
} from 'firebase/firestore';
import admin from 'firebase-admin';
import { firebaseConfig } from '@/firebase/config';
import { getAdminApp } from './admin-init';

// Try to use admin SDK when credentials are available, otherwise fallback to client SDK
let adminDb: admin.firestore.Firestore | null = null;
const adminApp = getAdminApp();
if (adminApp) {
  adminDb = adminApp.firestore();
}

const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const firestore = getFirestore(firebaseApp);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { uin } = req.query;
  if (!uin || typeof uin !== 'string') return res.status(400).json({ error: 'Missing uin query parameter' });

  try {
    const results: Array<any> = [];

    // Search by field across all testReports
    if (adminDb) {
      const adminSnap = await adminDb.collectionGroup('testReports').where('uin', '==', uin).get();
      adminSnap.forEach((d) => results.push({ path: d.ref.path, id: d.id, data: d.data() }));
    } else {
      const reportsRef = collectionGroup(firestore, 'testReports');
      const q = query(reportsRef, where('uin', '==', uin));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        results.push({ path: d.ref.path, id: d.id, data: d.data() });
      }
    }

    // Fallback: check users/{uid}/testReports/{uin}
    if (adminDb) {
      // Use admin SDK to list users collection and check doc by id
      const usersSnap = await adminDb.collection('users').limit(1000).get();
      for (const u of usersSnap.docs) {
        const candidate = await adminDb.collection('users').doc(u.id).collection('testReports').doc(uin).get();
        if (candidate.exists) results.push({ path: candidate.ref.path, id: candidate.id, data: candidate.data() });
      }
    } else {
      const usersRef = collection(firestore, 'users');
      const usersSnap = await getDocs(query(usersRef, limit(1000)));
      for (const u of usersSnap.docs) {
        const uid = u.id;
        const candidateRef = doc(firestore, 'users', uid, 'testReports', uin);
        const candidateSnap = await getDoc(candidateRef);
        if (candidateSnap.exists()) {
          results.push({ path: candidateSnap.ref.path, id: candidateSnap.id, data: candidateSnap.data() });
        }
      }
    }

    return res.status(200).json({ count: results.length, results });
  } catch (error: any) {
    return res.status(500).json({ error: String(error) });
  }
}
