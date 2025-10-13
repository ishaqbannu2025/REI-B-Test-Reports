
'use client';
import { DataTable } from './components/data-table';
import { columns } from './components/columns';
import { useFirebase, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, orderBy, getDocs, collectionGroup, doc, getDoc } from 'firebase/firestore';
import type { TestReport } from '@/lib/types';
import { useEffect, useState } from 'react';

export default function ViewReportsPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const [allReports, setAllReports] = useState<TestReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!firestore || !user) return;

    const checkAdminStatus = async () => {
      try {
        const idTokenResult = await user.getIdTokenResult();
        setIsAdmin(idTokenResult.claims.role === 'Admin');
      } catch (e) {
        console.error("Error checking admin status:", e);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [firestore, user]);


  useEffect(() => {
    if (isLoading || !firestore || !user) return;

    const fetchReports = () => {
        let reportsQuery;
        
        if (isAdmin) {
          reportsQuery = query(collectionGroup(firestore, 'testReports'), orderBy('entryDate', 'desc'));
        } else {
          reportsQuery = query(collection(firestore, `users/${user.uid}/testReports`), orderBy('entryDate', 'desc'));
        }
        
        getDocs(reportsQuery)
            .then(querySnapshot => {
                const reports: TestReport[] = [];
                querySnapshot.forEach(reportDoc => {
                    reports.push({ id: reportDoc.id, ...reportDoc.data() } as TestReport);
                });
                setAllReports(reports);
            })
            .catch(serverError => {
                const path = isAdmin ? 'testReports' : `users/${user.uid}/testReports`;
                const permissionError = new FirestorePermissionError({
                    operation: 'list',
                    path: path,
                });
                errorEmitter.emit('permission-error', permissionError);
            });
    };

    fetchReports();
  }, [firestore, user, isAdmin, isLoading]);


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
