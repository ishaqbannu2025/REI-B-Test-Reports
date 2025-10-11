'use client';
import { DataTable } from './components/data-table';
import { columns } from './components/columns';
import { useFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, getDocs, collectionGroup, doc, getDoc } from 'firebase/firestore';
import type { TestReport } from '@/lib/types';
import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';

const isAdminUser = async (user: User | null, firestore: any): Promise<boolean> => {
  if (!user || !firestore) return false;
  const userDocRef = doc(firestore, 'users', user.uid);
  try {
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      return userDoc.data().role === 'Admin';
    }
    return false;
  } catch (error) {
    console.error("Error checking admin status:", error);
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
      let reportsQuery;
      try {
        const isAdmin = await isAdminUser(user, firestore);

        if (isAdmin) {
          // Admin user: fetch all reports using a collection group query.
          reportsQuery = query(collectionGroup(firestore, 'testReports'), orderBy('entryDate', 'desc'));
        } else {
          // Regular user: Fetch only their own reports.
          reportsQuery = query(collection(firestore, `users/${user.uid}/testReports`), orderBy('entryDate', 'desc'));
        }
        
        const querySnapshot = await getDocs(reportsQuery);
        const reports: TestReport[] = [];
        querySnapshot.forEach(reportDoc => {
          reports.push({ id: reportDoc.id, ...reportDoc.data() } as TestReport);
        });
        setAllReports(reports);

      } catch (serverError: any) {
        console.error("Firestore Error:", serverError);
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
