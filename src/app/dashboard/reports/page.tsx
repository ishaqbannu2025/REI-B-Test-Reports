'use client';
import { DataTable } from './components/data-table';
import { columns } from './components/columns';
import { useFirebase, useUser, FirestorePermissionError, errorEmitter } from '@/firebase';
import { collection, query, orderBy, getDocs, Query, collectionGroup } from 'firebase/firestore';
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
      let reportsQuery: Query;
      if (isAdminUser(user)) {
        // Admin: Use a collection group query to get all reports.
        // This requires a Firestore index.
        reportsQuery = query(collectionGroup(firestore, 'testReports'), orderBy('entryDate', 'desc'));
      } else {
        // Regular user: Fetch only their own reports
        reportsQuery = query(collection(firestore, `users/${user.uid}/testReports`), orderBy('entryDate', 'desc'));
      }
      
      getDocs(reportsQuery).then(reportsSnapshot => {
        const reports: TestReport[] = [];
        reportsSnapshot.forEach(reportDoc => {
            reports.push({ id: reportDoc.id, ...reportDoc.data() } as TestReport);
        });
        setAllReports(reports);
        setIsLoading(false);
      }).catch(error => {
        const path = (reportsQuery as any)._query.path.canonicalString();
        const contextualError = new FirestorePermissionError({
            operation: 'list',
            path: path,
        });
        errorEmitter.emit('permission-error', contextualError);
        setIsLoading(false);
      });
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
