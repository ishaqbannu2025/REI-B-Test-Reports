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
      if (isAdminUser(user)) {
        // Admin: Fetch all users, then fetch reports for each user
        const usersCollectionRef = collection(firestore, 'users');
        const usersSnapshot = await getDocs(usersCollectionRef);

        for (const userDoc of usersSnapshot.docs) {
          const reportsCollectionRef = collection(firestore, `users/${userDoc.id}/testReports`);
          const reportsQuery = query(reportsCollectionRef, orderBy('entryDate', 'desc'));
          const reportsSnapshot = await getDocs(reportsQuery);
          reportsSnapshot.forEach(reportDoc => {
            reports.push({ id: reportDoc.id, ...reportDoc.data() } as TestReport);
          });
        }
         // Since we fetch from multiple users, we need to sort again globally
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
      setIsLoading(false);
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
