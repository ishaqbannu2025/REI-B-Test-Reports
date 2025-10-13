'use client';
import { DataTable } from './components/data-table';
import { columns } from './components/columns';
import { useFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, getDocs, collectionGroup } from 'firebase/firestore';
import type { TestReport } from '@/lib/types';
import { useEffect, useState } from 'react';
import { FirestorePermissionError, errorEmitter } from '@/firebase';

export default function ViewReportsPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const [allReports, setAllReports] = useState<TestReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This function will be called whenever the user or firestore instance changes.
    const fetchReports = async () => {
      // Guard clause: Do not proceed if user or firestore are not ready.
      if (!user || !firestore) {
          setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Force a token refresh to get the latest custom claims.
        const idTokenResult = await user.getIdTokenResult(true);
        const isAdmin = idTokenResult.claims?.role === 'Admin';
        
        let reportsQuery;
        if (isAdmin) {
          // Admin gets all reports from the collection group
          reportsQuery = query(collectionGroup(firestore, 'testReports'), orderBy('entryDate', 'desc'));
        } else {
          // Regular user gets only their own reports
          reportsQuery = query(collection(firestore, 'users', user.uid, 'testReports'), orderBy('entryDate', 'desc'));
        }

        const querySnapshot = await getDocs(reportsQuery);
        const reports: TestReport[] = querySnapshot.docs.map(reportDoc => ({
          id: reportDoc.id,
          ...reportDoc.data()
        } as TestReport));
        
        setAllReports(reports);

      } catch (error) {
        console.error("Error fetching reports:", error);
         // Create a contextual error for the failed collection group query
         const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: 'testReports (collection group)',
        });
        errorEmitter.emit('permission-error', contextualError);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReports();

  }, [user, firestore]); // Dependency array ensures this runs when user or firestore are resolved.


  if (isLoading) {
    return <div>Loading reports...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Test Reports</h1>
      <DataTable columns={columns} data={allReports || []} />
    </div>
  );
}
