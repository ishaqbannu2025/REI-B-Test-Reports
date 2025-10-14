import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collectionGroup, query, where, getDocs } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const firestore = getFirestore(firebaseApp);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  if (method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { uin } = req.query;
  if (!uin || typeof uin !== 'string') return res.status(400).json({ error: 'Missing uin query parameter' });

  try {
    const reportsRef = collectionGroup(firestore, 'testReports');
    const q = query(reportsRef, where('uin', '==', uin));
    const snap = await getDocs(q);
    if (snap.empty) return res.status(404).json({ error: 'Report not found' });

    const doc = snap.docs[0];
    const data = doc.data();
    return res.status(200).json({ id: doc.id, ...data });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || String(error) });
  }
}
