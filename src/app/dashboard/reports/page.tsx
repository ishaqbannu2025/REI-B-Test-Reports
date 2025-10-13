
'use client';
import { DataTable } from './components/data-table';
import { columns } from './components/columns';
import { useFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, getDocs, collectionGroup } from 'firebase/firestore';
import type { TestReport } from '@/lib/types';
import { useEffect, useState } from 'react';
import { FirestorePermissionError, errorEmitter } from '@/firebase';

export default function ViewReportsPage() {
  const { firestore, user } = useUser(); // useUser directly
  const [allReports, setAllReports] = useState<TestReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      if (!user || !firestore) {
        setIsLoading(true);
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Force refresh the token to get the latest claims, including the 'Admin' role.
        const idTokenResult = await user.getIdTokenResult(true);
        const isAdmin = idTokenResult.claims.role === 'Admin';
        
        let reportsQuery;
        if (isAdmin) {
          // If admin, query the entire collection group for all reports.
          reportsQuery = query(collectionGroup(firestore, 'testReports'), orderBy('entryDate', 'desc'));
        } else {
          // If not admin, query only the reports created by the current user.
          reportsQuery = query(collection(firestore, 'users', user.uid, 'testReports'), orderBy('entryDate', 'desc'));
        }
        
        const querySnapshot = await getDocs(reportsQuery);
        
        const reports: TestReport[] = querySnapshot.docs.map(reportDoc => ({
          id: reportDoc.id,
          ...reportDoc.data()
        } as TestReport));
        
        setAllReports(reports);

      } catch (error) {
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
