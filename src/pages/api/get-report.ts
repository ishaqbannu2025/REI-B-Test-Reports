
import { getAdminApp } from './admin-init';
import { getFirestore } from 'firebase-admin/firestore';

export default async function handler(req, res) {
  const adminApp = getAdminApp();
  if (!adminApp) {
    console.error('GET-REPORT: Firebase Admin App is not initialized.');
    return res.status(500).json({ error: 'Firebase Admin not initialized.' });
  }

  try {
    console.log('GET-REPORT: Admin App initialized. Getting Firestore instance.');
    const db = getFirestore(adminApp);
    const reportsCollection = db.collection('Reports');
    
    console.log('GET-REPORT: Fetching documents from the Reports collection.');
    const snapshot = await reportsCollection.get();
    
    if (snapshot.empty) {
      console.warn('GET-REPORT: No documents found in the Reports collection.');
      return res.status(200).json({ reports: [] });
    }
    
    const reports = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    console.log(`GET-REPORT: Successfully fetched ${reports.length} report(s).`);
    res.status(200).json({ reports });

  } catch (error) {
    console.error('GET-REPORT: An error occurred while fetching reports:', error);
    res.status(500).json({
      error: 'Failed to fetch reports.',
      details: error.message,
    });
  }
}
