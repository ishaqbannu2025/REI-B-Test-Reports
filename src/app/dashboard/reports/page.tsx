'use client';
import { DataTable } from './components/data-table';
import { columns } from './components/columns';
import { useFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, getDocs, collectionGroup } from 'firebase/firestore';
import type { TestReport } from '@/lib/types';
import { useEffect, useState } from 'react';

export default function ViewReportsPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const [allReports, setAllReports] = useState<TestReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !firestore) {
      if(typeof user !== 'undefined') { 
        setIsLoading(false);
      }
      return;
    };

    const fetchReports = async () => {
      setIsLoading(true);
      // Simplified query: Fetch all reports for any authenticated user.
      // The security rules will handle permissions.
      const reportsQuery = query(collectionGroup(firestore, 'testReports'), orderBy('entryDate', 'desc'));
      
      const querySnapshot = await getDocs(reportsQuery);
      const reports: TestReport[] = [];
      querySnapshot.forEach(reportDoc => {
          reports.push({ id: reportDoc.id, ...reportDoc.data() } as TestReport);
      });
      setAllReports(reports);
      setIsLoading(false);
    };
    
    fetchReports().catch(error => {
      // Directly log the actual error instead of hiding it.
      console.error("FATAL: Failed to fetch reports:", error);
      setIsLoading(false);
    });

  }, [user, firestore]);


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
