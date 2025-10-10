'use client';
import { DataTable } from './components/data-table';
import { columns } from './components/columns';
import { useFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, getDocs, collectionGroup } from 'firebase/firestore';
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
      let reports: TestReport[] = [];
      try {
        if (isAdminUser(user)) {
           // Admin: Fetch all reports from the collection group.
          const reportsCollectionRef = collectionGroup(firestore, 'testReports');
          const reportsQuery = query(reportsCollectionRef, orderBy('entryDate', 'desc'));
          const reportsSnapshot = await getDocs(reportsQuery);
          reportsSnapshot.forEach(reportDoc => {
            reports.push({ id: reportDoc.id, ...reportDoc.data() } as TestReport);
          });
        } else {
          // Regular user: Fetch only their own reports
          const reportsCollectionRef = collection(firestore, `users/${user.uid}/testReports`);
          const reportsQuery = query(reportsCollectionRef, orderBy('entryDate', 'desc'));
          const reportsSnapshot = await getDocs(reportsQuery);
          reportsSnapshot.forEach(reportDoc => {
            reports.push({ id: reportDoc.id, ...reportDoc.data() } as TestReport);
          });
        }
        setAllReports(reports);
      } catch (e: any) {
        console.error("Error fetching reports:", e);
        // This could happen if the collectionGroup index is not set up yet.
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
