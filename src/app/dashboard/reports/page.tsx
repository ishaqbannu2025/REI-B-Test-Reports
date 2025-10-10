'use client';
import { DataTable } from './components/data-table';
import { columns } from './components/columns';
import { useFirebase, useUser, FirestorePermissionError, errorEmitter } from '@/firebase';
import { collection, query, orderBy, getDocs, Query } from 'firebase/firestore';
import type { TestReport } from '@/lib/types';
import { useEffect, useState } from 'react';

// Helper function to check for admin role
const isAdminUser = (user: any) => user && user.email === 'admin@example.gov';

export default function ViewReportsPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const [allReports, setAllReports] = useState<TestReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!firestore || !user) return;

    setIsLoading(true);

    const fetchReports = async () => {
      try {
        let reports: TestReport[] = [];
        if (isAdminUser(user)) {
          // Admin: fetch all users, then all reports for each user.
          const usersRef = collection(firestore, 'users');
          const usersSnapshot = await getDocs(usersRef).catch(error => {
            // This is the specific point of failure. We create a contextual error here.
            throw new FirestorePermissionError({
                operation: 'list',
                path: 'users',
            });
          });

          const reportPromises = usersSnapshot.docs.map(userDoc => {
            const reportsRef = collection(firestore, `users/${userDoc.id}/testReports`);
            return getDocs(reportsRef);
          });
          const reportSnapshots = await Promise.all(reportPromises);
          reportSnapshots.forEach(reportSnapshot => {
            reportSnapshot.forEach(reportDoc => {
              reports.push({ id: reportDoc.id, ...reportDoc.data() } as TestReport);
            });
          });
           // Sort reports by entry date since they are fetched from multiple sources
          reports.sort((a, b) => new Date(b.entryDate as any).getTime() - new Date(a.entryDate as any).getTime());
        } else {
          // Regular user: Fetch only their own reports
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
            // Handle other types of errors if necessary
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
