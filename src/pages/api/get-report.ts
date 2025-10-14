import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collectionGroup, query, where, getDocs, limit, collection, getDoc, doc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const firestore = getFirestore(firebaseApp);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  if (method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { uin, debug } = req.query;
  if (!uin || typeof uin !== 'string') return res.status(400).json({ error: 'Missing uin query parameter' });

  const isDebug = String(debug || '') === '1';

  try {
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
          },
        });
      }
      // Fallback: some flows store the UIN as the document ID under users/{uid}/testReports/{uin}
      // If collectionGroup by field didn't find a match, iterate users and check doc by ID.
      try {
        const usersRef = collection(firestore, 'users');
        const usersSnap = await getDocs(usersRef);
        for (const userDocSnap of usersSnap.docs) {
          const uid = userDocSnap.id;
          const candidateRef = doc(firestore, 'users', uid, 'testReports', uin);
          const candidateSnap = await getDoc(candidateRef);
          if (candidateSnap.exists()) {
            const dataObj = candidateSnap.data() || {};
            return res.status(200).json(Object.assign({ id: candidateSnap.id }, dataObj));
          }
        }
      } catch (err) {
        // ignore and fall through to not found
        console.warn('Fallback search failed', err);
      }

      return res.status(404).json({ error: 'Report not found' });
    }

    const doc = snap.docs[0];
    const data = doc.data();
    return res.status(200).json({ id: doc.id, ...data });
  } catch (error: any) {
    if (isDebug) {
      return res.status(500).json({ error: String(error), stack: error.stack });
    }
    return res.status(500).json({ error: error.message || String(error) });
  }
}
