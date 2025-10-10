'use client';
import { DataTable } from './components/data-table';
import { columns } from './components/columns';
import { useFirebase, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, orderBy, getDocs, Query } from 'firebase/firestore';
import type { TestReport } from '@/lib/types';
import { useEffect, useState } from 'react';

// Helper function to check for admin role
const isAdminUser = (user: any) => user && user.email === 'admin@example.gov';

async function getDocsWithContext(q: Query) {
  try {
      return await getDocs(q);
  } catch (error) {
      const path = (q as any)._query.path.canonicalString();
      const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: path,
      });
      errorEmitter.emit('permission-error', contextualError);
      throw contextualError;
  }
}

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
        if (isAdminUser(user)) {
           // Admin: Fetch all users, then fetch reports for each user.
           const usersCollection = collection(firestore, 'users');
           const usersSnapshot = await getDocsWithContext(usersCollection);
           
           const reportPromises = usersSnapshot.docs.map(userDoc => {
             const userReportsRef = collection(firestore, `users/${userDoc.id}/testReports`);
             const reportsQuery = query(userReportsRef, orderBy('entryDate', 'desc'));
             return getDocsWithContext(reportsQuery);
           });
           
           const reportSnapshots = await Promise.all(reportPromises);
           reportSnapshots.forEach(reportSnapshot => {
             reportSnapshot.forEach(reportDoc => {
               reports.push({ id: reportDoc.id, ...reportDoc.data() } as TestReport);
             });
           });
           // Since we are fetching from multiple users, we need to sort again.
           reports.sort((a, b) => (b.entryDate as any) - (a.entryDate as any));
        } else {
          // Regular user: Fetch only their own reports
          const reportsCollectionRef = collection(firestore, `users/${user.uid}/testReports`);
          const reportsQuery = query(reportsCollectionRef, orderBy('entryDate', 'desc'));
          const reportsSnapshot = await getDocsWithContext(reportsQuery);
          reportsSnapshot.forEach(reportDoc => {
            reports.push({ id: reportDoc.id, ...reportDoc.data() } as TestReport);
          });
        }
        setAllReports(reports);
      } catch (e: any) {
        // Errors are now thrown by getDocsWithContext and caught by the boundary
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
