'use client';
import { DataTable } from './components/data-table';
import { columns } from './components/columns';
import { useFirebase, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
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
      if(typeof user !== 'undefined') { 
        setIsLoading(false);
      }
      return;
    };

    const fetchReports = async () => {
      setIsLoading(true);
      const reportsQuery = query(collectionGroup(firestore, 'testReports'), orderBy('entryDate', 'desc'));
      
      try {
        const querySnapshot = await getDocs(reportsQuery);
        const reports: TestReport[] = [];
        querySnapshot.forEach(reportDoc => {
            reports.push({ id: reportDoc.id, ...reportDoc.data() } as TestReport);
        });
        setAllReports(reports);
        setIsLoading(false);
      } catch (error) {
        // Create a contextual error for the failed collection group query
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: 'testReports (collection group)',
        });
        // Emit the error for the global listener
        errorEmitter.emit('permission-error', contextualError);
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
