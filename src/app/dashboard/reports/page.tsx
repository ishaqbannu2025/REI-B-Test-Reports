'use client';
import { DataTable } from './components/data-table';
import { columns } from './components/columns';
import { useFirebase, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, orderBy, getDocs, Query, DocumentData } from 'firebase/firestore';
import type { TestReport } from '@/lib/types';
import { useEffect, useState } from 'react';

// Helper function to check for admin role
const isAdminUser = (user: any) => user && user.email === 'admin@example.gov';

/**
 * A wrapper around getDocs that includes contextual error handling for security rule violations.
 * @param q The Firestore query to execute.
 * @returns A promise that resolves with the query snapshot.
 */
async function getDocsWithContext(q: Query<DocumentData>) {
  try {
    return await getDocs(q);
  } catch (error) {
    const path = (q as any)._query.path.canonicalString();
    const contextualError = new FirestorePermissionError({
      operation: 'list',
      path: path,
    });
    errorEmitter.emit('permission-error', contextualError);
    // Re-throw the original error if needed, or handle it gracefully
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
          // Admin: Fetch all users, then fetch reports for each user
          const usersCollectionRef = collection(firestore, 'users');
          const usersSnapshot = await getDocsWithContext(usersCollectionRef);

          for (const userDoc of usersSnapshot.docs) {
            const reportsCollectionRef = collection(firestore, `users/${userDoc.id}/testReports`);
            const reportsQuery = query(reportsCollectionRef, orderBy('entryDate', 'desc'));
            const reportsSnapshot = await getDocsWithContext(reportsQuery);
            reportsSnapshot.forEach(reportDoc => {
              reports.push({ id: reportDoc.id, ...reportDoc.data() } as TestReport);
            });
          }
           // Since we fetch from multiple users, we need to sort again globally
          reports.sort((a, b) => (b.entryDate as any) - (a.entryDate as any));

        } else {
          // Regular user: Fetch only their own reports
          const reportsCollectionRef = collection(firestore, `users/${user.uid}/testReports`);
          const reportsQuery = query(reportsCollection-Ref, orderBy('entryDate', 'desc'));
          const reportsSnapshot = await getDocsWithContext(reportsQuery);
          reportsSnapshot.forEach(reportDoc => {
            reports.push({ id: reportDoc.id, ...reportDoc.data() } as TestReport);
          });
        }
        setAllReports(reports);
      } catch (e) {
        console.info("Caught permission error, letting the listener handle it.");
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
