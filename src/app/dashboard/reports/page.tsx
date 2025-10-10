'use client';
import { DataTable } from './components/data-table';
import { columns } from './components/columns';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { TestReport } from '@/lib/types';

export default function ViewReportsPage() {
  const { firestore } = useFirebase();
  const reportsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'test_reports_public'), orderBy('entryDate', 'desc')) : null),
    [firestore]
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
