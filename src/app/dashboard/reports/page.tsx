'use client';
import { DataTable } from './components/data-table';
import { columns } from './components/columns';
import { useFirebase, useUser, FirestorePermissionError, errorEmitter } from '@/firebase';
import { collection, query, orderBy, getDocs, Query, DocumentData } from 'firebase/firestore';
import type { TestReport } from '@/lib/types';
import { useEffect, useState } from 'react';

// Helper function to check for admin role using custom claims
const isAdminUser = async (user: any): Promise<boolean> => {
  if (!user) return false;
  try {
    const idTokenResult = await user.getIdTokenResult();
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
          // Admin user: fetch all users, then fetch reports for each user.
          const usersCollectionRef = collection(firestore, 'users');
          const usersSnapshot = await getDocs(usersCollectionRef).catch(error => {
            throw new FirestorePermissionError({
              operation: 'list',
              path: 'users',
            });
          });

          const reportPromises = usersSnapshot.docs.map(userDoc => {
            const userReportsRef = collection(firestore, `users/${userDoc.id}/testReports`);
            const userReportsQuery = query(userReportsRef, orderBy('entryDate', 'desc'));
            return getDocs(userReportsQuery);
          });
          
          const reportSnapshots = await Promise.all(reportPromises);
          reportSnapshots.forEach(reportSnapshot => {
            reportSnapshot.forEach(reportDoc => {
              reports.push({ id: reportDoc.id, ...reportDoc.data() } as TestReport);
            });
          });
           // Sort all collected reports by date
          reports.sort((a, b) => (b.entryDate as any) - (a.entryDate as any));

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
