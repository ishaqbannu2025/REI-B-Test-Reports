'use client';
import { DataTable } from './components/data-table';
import { columns } from './components/columns';
import { useFirebase, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, collectionGroup } from 'firebase/firestore';
import type { TestReport } from '@/lib/types';

export default function ViewReportsPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  
  // Use a collection group query to get all reports if user is an admin.
  // Otherwise, just get the reports for the current user.
  // This assumes an 'Admin' role check, which should be properly implemented.
  const reportsQuery = useMemoFirebase(
    () => {
        if (!firestore || !user) return null;
        // Simple role check logic, this should be more robust in a real app
        // (e.g., using custom claims).
        const isAdmin = user.email === 'admin@example.gov'; 
        
        if (isAdmin) {
            // Admin gets all reports from all users.
            return query(collectionGroup(firestore, 'testReports'), orderBy('entryDate', 'desc'));
        } else {
            // Regular user only gets their own reports.
            return query(collection(firestore, 'users', user.uid, 'testReports'), orderBy('entryDate', 'desc'));
        }
    },
    [firestore, user]
  );

  const { data: testReports, isLoading } = useCollection<TestReport>(reportsQuery);

  if (isLoading) {
    return <div>Loading reports...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Test Reports</h1>
      <DataTable columns={columns} data={testReports || []} />
    </div>
  );
}
