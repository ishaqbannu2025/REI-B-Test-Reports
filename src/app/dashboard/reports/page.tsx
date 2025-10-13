'use client';
import { DataTable } from './components/data-table';
import { columns } from './components/columns';
import { useFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, getDocs, collectionGroup } from 'firebase/firestore';
import type { TestReport } from '@/lib/types';
import { useEffect, useState } from 'react';
import { FirestorePermissionError, errorEmitter } from '@/firebase';

export default function ViewReportsPage() {
  const { firestore, user } = useFirebase();
  const [allReports, setAllReports] = useState<TestReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      // Wait until both user and firestore are available.
      if (!user || !firestore) {
        setIsLoading(true);
        return;
      }
      setIsLoading(true);
      
      try {
        // Force a token refresh to get the latest custom claims.
        const idTokenResult = await user.getIdTokenResult(true);
        const isAdmin = idTokenResult.claims.role === 'Admin';
        
        let reportsQuery;
        if (isAdmin) {
          // Admins can query all reports across all users.
          reportsQuery = query(collectionGroup(firestore, 'testReports'), orderBy('entryDate', 'desc'));
        } else {
          // Regular users can only query their own reports.
          reportsQuery = query(collection(firestore, 'users', user.uid, 'testReports'), orderBy('entryDate', 'desc'));
        }
        
        const querySnapshot = await getDocs(reportsQuery);
        
        const reports: TestReport[] = querySnapshot.docs.map(reportDoc => ({
          id: reportDoc.id,
          ...reportDoc.data()
        } as TestReport));
        
        setAllReports(reports);

      } catch (error) {
        // Create a contextual error for the failed collection group query
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: 'testReports (collection group)',
        });
        // Emit the error to be caught by the global error listener
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
