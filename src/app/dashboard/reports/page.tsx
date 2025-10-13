
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
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    if (!user) {
      if(typeof user !== 'undefined') { // if user is null (logged out)
        setIsLoading(false);
      }
      // if user is undefined, still loading
      return;
    };

    const checkAdminAndFetchData = async () => {
      setIsLoading(true);
      try {
        const idTokenResult = await user.getIdTokenResult();
        const isAdminUser = idTokenResult.claims.role === 'Admin';
        setIsAdmin(isAdminUser);

        if (!firestore) {
          setIsLoading(false);
          return;
        }

        let reportsQuery;
        if (isAdminUser) {
          reportsQuery = query(collectionGroup(firestore, 'testReports'), orderBy('entryDate', 'desc'));
        } else {
          reportsQuery = query(collection(firestore, `users/${user.uid}/testReports`), orderBy('entryDate', 'desc'));
        }
        
        const querySnapshot = await getDocs(reportsQuery);
        const reports: TestReport[] = [];
        querySnapshot.forEach(reportDoc => {
            reports.push({ id: reportDoc.id, ...reportDoc.data() } as TestReport);
        });
        setAllReports(reports);

      } catch (serverError: any) {
        if (serverError instanceof FirestorePermissionError) {
          errorEmitter.emit('permission-error', serverError);
        } else {
          const path = isAdmin ? 'testReports' : `users/${user.uid}/testReports`;
          const permissionError = new FirestorePermissionError({
            operation: 'list',
            path: path,
          });
          errorEmitter.emit('permission-error', permissionError);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAdminAndFetchData();

  }, [user, firestore, isAdmin]); // Reruns when user or firestore instance is available. isAdmin is added to refetch if role changes.


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
