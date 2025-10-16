import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore as getClientFirestore, collection, getDocs, DocumentData } from 'firebase/firestore';
import { getAdminApp } from './admin-init';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/firebase/config';

// Initialize Client SDK for fallback reads
const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const clientFirestore = getClientFirestore(firebaseApp);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const adminApp = getAdminApp();

  if (adminApp) {
    try {
      console.log('GET-REPORT: Admin App initialized. Getting Firestore instance.');
      const db = getAdminFirestore(adminApp);
      const reportsCollection = db.collection('Reports');
      
      console.log('GET-REPORT: Fetching documents from the Reports collection using Admin SDK.');
      const snapshot = await reportsCollection.get();
      
      if (snapshot.empty) {
        console.warn('GET-REPORT: No documents found in the Reports collection.');
        return res.status(200).json({ reports: [] });
      }
      
      const reports = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      console.log(`GET-REPORT: Successfully fetched ${reports.length} report(s) using Admin SDK.`);
      res.status(200).json({ reports });

    } catch (error: any) {
      console.error('GET-REPORT: An error occurred while fetching reports using Admin SDK:', error);
      
      // If Admin SDK fails (likely permissions), fall back to client SDK read
      console.warn('GET-REPORT: Admin SDK failed. Falling back to Client SDK read.');
      
      try {
        const reportsCollectionRef = collection(clientFirestore, 'Reports');
        const snapshot = await getDocs(reportsCollectionRef);
        
        if (snapshot.empty) {
          console.warn('GET-REPORT: No documents found in the Reports collection (Client fallback).');
          return res.status(200).json({ reports: [] });
        }
        
        const reports = snapshot.docs.map((doc: DocumentData) => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        console.log(`GET-REPORT: Successfully fetched ${reports.length} report(s) using Client SDK.`);
        res.status(200).json({ reports });
      } catch (clientError: any) {
        console.error('GET-REPORT: Client SDK fallback also failed:', clientError);
        res.status(500).json({
          error: 'Failed to fetch reports.',
          details: `Admin failed: ${error.message}. Client failed: ${clientError.message}`,
        });
      }
    }
  } else {
    // Admin App not initialized at all, use client SDK directly
    console.log('GET-REPORT: Firebase Admin App is not initialized. Using Client SDK.');
    try {
      const reportsCollectionRef = collection(clientFirestore, 'Reports');
      const snapshot = await getDocs(reportsCollectionRef);
      
      if (snapshot.empty) {
        console.warn('GET-REPORT: No documents found in the Reports collection (Client only).');
        return res.status(200).json({ reports: [] });
      }
      
      const reports = snapshot.docs.map((doc: DocumentData) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      console.log(`GET-REPORT: Successfully fetched ${reports.length} report(s) using Client SDK.`);
      res.status(200).json({ reports });
    } catch (error: any) {
      console.error('GET-REPORT: An error occurred while fetching reports using Client SDK:', error);
      res.status(500).json({
        error: 'Failed to fetch reports.',
        details: error.message,
      });
    }
  }
}
