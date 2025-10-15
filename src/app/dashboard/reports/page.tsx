'use client';
import { DataTable } from './components/data-table';
import { columns } from './components/columns';
import type { TestReport } from '@/lib/types';
import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';

export default function ViewReportsPage() {
  const { user } = useUser(); // Get the authenticated user
  const [myReports, setMyReports] = useState<TestReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch if the user is logged in.
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchReports = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Make the API call to our backend endpoint
        const response = await fetch('/api/get-report');

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch reports from API');
        }

        const data = await response.json();
        setMyReports(data.reports);

      } catch (err) {
        console.error("Error fetching reports:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();

  }, [user]); // The effect re-runs if the user logs in or out

  if (isLoading) {
    return <div>Loading reports...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }
  
  if (!user) {
    return <div>Please log in to view reports.</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">My Test Reports</h1>
      <DataTable columns={columns} data={myReports || []} />
    </div>
  );
}