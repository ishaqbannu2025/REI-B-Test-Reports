import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

// Initialize Firebase client SDK
const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const firestore = getFirestore(firebaseApp);

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

    const reportData = {
      ...values,
      entryDate: serverTimestamp(),
      enteredBy: userUid,
    };
    const userReportRef = doc(firestore, 'users', userUid, 'testReports', values.uin);
    await setDoc(userReportRef, reportData, { merge: true });
    console.info('[create-report] Report written', { path: userReportRef.path, uin: values.uin });
    return res.status(200).json({ message: 'Report created', uin: values.uin, path: userReportRef.path });
  } catch (error: any) {
    console.error('[create-report] Error', error);
    // Expose minimal debug info but avoid leaking secrets
    return res.status(500).json({ error: String(error?.message || error), debug: { name: error?.name } });
  }
}
