import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

// Initialize Firebase client SDK
const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const firestore = getFirestore(firebaseApp);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { values, userUid } = req.body;
    if (!values || !userUid) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const reportData = {
      ...values,
      entryDate: serverTimestamp(),
      enteredBy: userUid,
    };
    const userReportRef = doc(firestore, 'users', userUid, 'testReports', values.uin);
    await setDoc(userReportRef, reportData, { merge: true });
    return res.status(200).json({ message: 'Report created', uin: values.uin });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
