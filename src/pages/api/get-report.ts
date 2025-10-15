import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collectionGroup, query, where, getDocs, limit, collection, getDoc, doc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { getAdminApp } from './admin-init';
import admin from 'firebase-admin';

const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const firestore = getFirestore(firebaseApp);
const adminApp = getAdminApp();
const adminDb: admin.firestore.Firestore | null = adminApp ? adminApp.firestore() : null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  if (method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { uin, debug } = req.query;
  if (!uin || typeof uin !== 'string') return res.status(400).json({ error: 'Missing uin query parameter' });

  const isDebug = String(debug || '') === '1';

  try {
    // Prefer admin SDK when available for broader read access
    if (adminDb) {
      console.info('[get-report] Using admin SDK to query collectionGroup for uin=', uin);
      const adminSnap = await adminDb.collectionGroup('testReports').where('uin', '==', uin).limit(1).get();
      if (!adminSnap.empty) {
        const d = adminSnap.docs[0];
        return res.status(200).json({ id: d.id, path: d.ref.path, data: d.data() });
      }
      // fallback to per-user doc lookup using admin
      const usersSnap = await adminDb.collection('users').limit(1000).get();
      for (const u of usersSnap.docs) {
        const candidate = await adminDb.collection('users').doc(u.id).collection('testReports').doc(uin).get();
        if (candidate.exists) {
          return res.status(200).json({ id: candidate.id, path: candidate.ref.path, data: candidate.data() });
        }
      }

      if (isDebug) {
        const projectId = (firebaseApp && (firebaseApp as any).options && (firebaseApp as any).options.projectId) || null;
        return res.status(404).json({ error: 'Report not found', debug: { projectId, matchingDocs: 0, used: 'admin' } });
      }
      return res.status(404).json({ error: 'Report not found' });
    }

    // Non-admin path: use client SDK collectionGroup query
    console.info('[get-report] Using client SDK to query collectionGroup for uin=', uin);
    const reportsRef = collectionGroup(firestore, 'testReports');
    const q = query(reportsRef, where('uin', '==', uin));
    const snap = await getDocs(q);

    if (snap.empty) {
      // If debug requested, include some diagnostics to help trace the issue
      if (isDebug) {
        // Check whether any documents exist in a sample query to confirm connection
        const sampleQ = query(reportsRef, limit(1));
        const sampleSnap = await getDocs(sampleQ);
        const projectId = (firebaseApp && (firebaseApp as any).options && (firebaseApp as any).options.projectId) || null;
        return res.status(404).json({
          error: 'Report not found',
          debug: {
            projectId,
            matchingDocs: snap.size,
            sampleDocs: sampleSnap.size,
            used: 'client',
          },
        });
      }
      // Fallback: some flows store the UIN as the document ID under users/{uid}/testReports/{uin}
      // If collectionGroup by field didn't find a match, iterate users and check doc by ID.
      try {
        const usersRef = collection(firestore, 'users');
        const usersSnap = await getDocs(query(usersRef, limit(1000)));
        for (const userDocSnap of usersSnap.docs) {
          const uid = userDocSnap.id;
          const candidateRef = doc(firestore, 'users', uid, 'testReports', uin);
          const candidateSnap = await getDoc(candidateRef);
          if (candidateSnap.exists()) {
            const dataObj = candidateSnap.data() || {};
            return res.status(200).json(Object.assign({ id: candidateSnap.id, path: candidateSnap.ref.path }, dataObj));
          }
        }
      } catch (err) {
        // ignore and fall through to not found
        console.warn('[get-report] Fallback search failed', err);
      }

      return res.status(404).json({ error: 'Report not found' });
    }

    const foundDoc = snap.docs[0];
    const data = foundDoc.data();
    return res.status(200).json({ id: foundDoc.id, path: foundDoc.ref.path, ...data });
  } catch (error: any) {
    if (isDebug) {
      console.error('[get-report] Debug error', error);
      return res.status(500).json({ error: String(error), stack: error?.stack });
    }
    console.error('[get-report] Error', error);
    return res.status(500).json({ error: error.message || String(error) });
  }
}
