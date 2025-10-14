
'use client';
import { DataTable } from './components/data-table';
import { columns } from './components/columns';
import { useFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import type { TestReport } from '@/lib/types';
import { useEffect, useState } from 'react';
import { FirestorePermissionError, errorEmitter } from '@/firebase';

export default function ViewReportsPage() {
  const { user, firestore } = useFirebase();
  const [myReports, setMyReports] = useState<TestReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !firestore) {
      setIsLoading(true);
      return;
    }
    
    setIsLoading(true);
    
    // Query only the reports belonging to the current user.
    const userReportsCollection = collection(firestore, 'users', user.uid, 'testReports');
    const reportsQuery = query(userReportsCollection, orderBy('entryDate', 'desc'));
    
    const unsubscribe = onSnapshot(reportsQuery, (querySnapshot) => {
      const reports: TestReport[] = querySnapshot.docs.map(reportDoc => ({
        id: reportDoc.id,
        ...reportDoc.data()
      } as TestReport));
      
      setMyReports(reports);
      setIsLoading(false);
    }, (error) => {
      const contextualError = new FirestorePermissionError({
        operation: 'list',
        path: `users/${user.uid}/testReports`,
      });
      errorEmitter.emit('permission-error', contextualError);
      setIsLoading(false);
    });

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();

  }, [user, firestore]); 


  if (isLoading) {
    return <div>Loading reports...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">My Test Reports</h1>
      <DataTable columns={columns} data={myReports || []} />
    </div>
  );
}
