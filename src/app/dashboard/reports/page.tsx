'use client';
import { DataTable } from './components/data-table';
import { columns } from './components/columns';
import { useFirebase, useUser, FirestorePermissionError, errorEmitter } from '@/firebase';
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
    // Don't emit here, as it can cause loops if the user collection is the one with permission issues
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
         const path = `users/${user.uid}/testReports`;
         const permissionError = new FirestorePermissionError({
           operation: 'list',
           path: path,
         });
         errorEmitter.emit('permission-error', permissionError);
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
