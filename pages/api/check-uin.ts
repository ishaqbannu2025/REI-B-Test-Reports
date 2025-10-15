import { getAdminApp } from './admin-init';
import { getFirestore } from 'firebase-admin/firestore';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { uin } = req.query;

  if (!uin) {
    return res.status(400).json({ error: 'UIN is required.' });
  }

  try {
    const adminApp = getAdminApp();
    if (!adminApp) {
      console.error('CHECK-UIN: Firebase Admin App is not initialized.');
      return res.status(500).json({ error: 'Firebase Admin not initialized.' });
    }
    const db = getFirestore(adminApp);
    
    // Perform the collection group query on the server
    const reportsRef = db.collectionGroup('testReports');
    const q = reportsRef.where('uin', '==', uin);
    const snapshot = await q.get();

    const exists = !snapshot.empty;
    
    res.status(200).json({ exists });

  } catch (error) {
    console.error('CHECK-UIN: An error occurred:', error);
    res.status(500).json({
      error: 'Failed to check UIN.',
      details: error.message,
    });
  }
}
