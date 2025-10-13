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
    const fetchReports = async () => {
      if (!user || !firestore) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // For simplicity and to rely on security rules, we will always attempt the collectionGroup query.
        // The rules will enforce that only admins can successfully execute this.
        // Non-admins will get a permission error, which is expected and handled.
        const reportsQuery = query(collectionGroup(firestore, 'testReports'), orderBy('entryDate', 'desc'));
        
        const querySnapshot = await getDocs(reportsQuery);
        
        const reports: TestReport[] = querySnapshot.docs.map(reportDoc => ({
          id: reportDoc.id,
          ...reportDoc.data()
        } as TestReport));
        
        setAllReports(reports);

      } catch (error) {
        console.error("Error fetching reports:", error);
        // If the collection group query fails, it's likely a non-admin user.
        // Let's try fetching just their own reports.
        try {
            const userReportsQuery = query(collection(firestore, 'users', user.uid, 'testReports'), orderBy('entryDate', 'desc'));
            const userQuerySnapshot = await getDocs(userReportsQuery);
            const userReports: TestReport[] = userQuerySnapshot.docs.map(reportDoc => ({
                id: reportDoc.id,
                ...reportDoc.data()
            } as TestReport));
            setAllReports(userReports);
        } catch (userError) {
             console.error("Error fetching user-specific reports:", userError);
             const contextualError = new FirestorePermissionError({
                operation: 'list',
                path: `users/${user.uid}/testReports`,
             });
             errorEmitter.emit('permission-error', contextualError);
        }
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
