'use client';
import { DataTable } from './components/data-table';
import { columns } from './components/columns';
import { useFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
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
           // Admin: Fetch all users, then fetch reports for each user.
           const usersSnapshot = await getDocs(collection(firestore, 'users'));
           const reportPromises = usersSnapshot.docs.map(userDoc => {
             const userReportsRef = collection(firestore, `users/${userDoc.id}/testReports`);
             return getDocs(query(userReportsRef, orderBy('entryDate', 'desc')));
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
          const reportsSnapshot = await getDocs(reportsQuery);
          reportsSnapshot.forEach(reportDoc => {
            reports.push({ id: reportDoc.id, ...reportDoc.data() } as TestReport);
          });
        }
        setAllReports(reports);
      } catch (e: any) {
        console.error("Error fetching reports:", e);
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
