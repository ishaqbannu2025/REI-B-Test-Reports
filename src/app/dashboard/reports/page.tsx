
'use client';
import { DataTable } from './components/data-table';
import { columns } from './components/columns';
import { useUser } from '@/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import type { TestReport } from '@/lib/types';
import { useEffect, useState } from 'react';
import { FirestorePermissionError, errorEmitter } from '@/firebase';

export default function ViewReportsPage() {
  const { user, firestore } = useUser(); // useUser directly
  const [myReports, setMyReports] = useState<TestReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      if (!user || !firestore) {
        setIsLoading(true);
        return;
      }
      
      setIsLoading(true);
      
      try {
        const userReportsCollection = collection(firestore, 'users', user.uid, 'testReports');
        const reportsQuery = query(userReportsCollection, orderBy('entryDate', 'desc'));
        
        const querySnapshot = await getDocs(reportsQuery);
        
        const reports: TestReport[] = querySnapshot.docs.map(reportDoc => ({
          id: reportDoc.id,
          ...reportDoc.data()
        } as TestReport));
        
        setMyReports(reports);

      } catch (error) {
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: `users/${user.uid}/testReports`,
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
      <h1 className="text-2xl font-semibold mb-4">My Test Reports</h1>
      <DataTable columns={columns} data={myReports || []} />
    </div>
  );
}
