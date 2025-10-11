'use client';
import { DataTable } from './components/data-table';
import { columns } from './components/columns';
import { useFirebase, useUser, FirestorePermissionError, errorEmitter } from '@/firebase';
import { collection, query, orderBy, getDocs, collectionGroup } from 'firebase/firestore';
import type { TestReport } from '@/lib/types';
import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';

// Helper function to check for admin role using custom claims
const isAdminUser = async (user: User | null): Promise<boolean> => {
  if (!user) return false;
  try {
    const idTokenResult = await user.getIdTokenResult();
    // This check relies on a custom claim 'admin' being set to true for admin users.
    // This is typically done on a secure backend, not in the client-side code.
    return idTokenResult.claims.admin === true;
  } catch (error) {
    console.error("Error getting user token claims:", error);
    return false;
  }
};

export default function ViewReportsPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const [allReports, setAllReports] = useState<TestReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!firestore || !user) return;

    setIsLoading(true);

    const fetchReports = async () => {
      let reports: TestReport[] = [];
      try {
        const isAdmin = await isAdminUser(user);

        if (isAdmin) {
          // Admin user: fetch all reports using a collection group query.
          // This is more efficient than fetching user by user and requires an index.
          const reportsQuery = query(collectionGroup(firestore, 'testReports'), orderBy('entryDate', 'desc'));
          const querySnapshot = await getDocs(reportsQuery).catch(error => {
            throw new FirestorePermissionError({
              operation: 'list',
              path: 'testReports',
            });
          });
          querySnapshot.forEach(reportDoc => {
            reports.push({ id: reportDoc.id, ...reportDoc.data() } as TestReport);
          });

        } else {
          // Regular user: Fetch only their own reports.
          const reportsQuery = query(collection(firestore, `users/${user.uid}/testReports`), orderBy('entryDate', 'desc'));
          const reportsSnapshot = await getDocs(reportsQuery);
           reportsSnapshot.forEach(reportDoc => {
            reports.push({ id: reportDoc.id, ...reportDoc.data() } as TestReport);
          });
        }
        
        setAllReports(reports);
      } catch (error: any) {
        if (error instanceof FirestorePermissionError) {
          errorEmitter.emit('permission-error', error);
        } else {
          console.error("An unexpected error occurred:", error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [firestore, user]);


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
