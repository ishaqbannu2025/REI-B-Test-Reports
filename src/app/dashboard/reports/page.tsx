
'use client';
import { DataTable } from './components/data-table';
import { columns } from './components/columns';
import { useFirebase } from '@/firebase';
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
      if (!user || !firestore) {
        setIsLoading(true); // Keep loading if user/firestore isn't ready
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Force refresh of the token to ensure we have the latest claims.
        // This is the definitive step to confirm the user's role.
        const idTokenResult = await user.getIdTokenResult(true);
        const isAdmin = idTokenResult.claims.role === 'Admin';
        
        let reportsQuery;
        if (isAdmin) {
          // If the user is an admin, query the entire 'testReports' collection group.
          reportsQuery = query(collectionGroup(firestore, 'testReports'), orderBy('entryDate', 'desc'));
        } else {
          // If not an admin, only fetch reports for the current user.
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

