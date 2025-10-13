'use client';
import { DataTable } from './components/data-table';
import { columns } from './components/columns';
import { useFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, getDocs, collectionGroup } from 'firebase/firestore';
import type { TestReport } from '@/lib/types';
import { useEffect, useState } from 'react';

export default function ViewReportsPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const [allReports, setAllReports] = useState<TestReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !firestore) {
      if(typeof user !== 'undefined') { // if user is explicitly null (not loading)
        setIsLoading(false);
      }
      return;
    };

    const fetchReports = async () => {
      setIsLoading(true);
      try {
        const idTokenResult = await user.getIdToken(true); // Force refresh to get latest claims
        const claims = (idTokenResult as any).claims;
        const isAdmin = claims.role === 'Admin';
        
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
        // Optionally set an error state to show in the UI
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReports();

  }, [user, firestore]);


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
