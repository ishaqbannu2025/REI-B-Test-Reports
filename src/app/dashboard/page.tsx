'use client';

import { StatCard } from './components/stat-card';
import { CategoryChart } from './components/category-chart';
import { RecentReports } from './components/recent-reports';
import { Home, Factory, Building2, FileText, IndianRupee } from 'lucide-react';
import type { TestReport } from '@/lib/types';
import { useFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, getDocs, Query } from 'firebase/firestore';
import { useEffect, useState } from 'react';

// Helper function to check for admin role
const isAdminUser = (user: any) => user && user.email === 'admin@example.gov';

export default function DashboardPage() {
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
          // Admin: Fetch all user docs, then get reports for each user.
          const usersSnapshot = await getDocs(collection(firestore, 'users'));
          const reportPromises = usersSnapshot.docs.map(userDoc => {
            const userReportsRef = collection(firestore, `users/${userDoc.id}/testReports`);
            return getDocs(query(userReportsRef, orderBy('entryDate', 'desc')));
          });

          const reportSnapshots = await Promise.all(reportPromises);
          reportSnapshots.forEach(snapshot => {
            snapshot.forEach(reportDoc => {
              reports.push({ id: reportDoc.id, ...reportDoc.data() } as TestReport);
            });
          });
          // Sort all reports by entryDate since they are fetched in chunks
          reports.sort((a, b) => (b.entryDate as any) - (a.entryDate as any));

        } else {
          // Regular user: Fetch only their own reports
          const reportsQuery = query(collection(firestore, `users/${user.uid}/testReports`), orderBy('entryDate', 'desc'));
          const reportsSnapshot = await getDocs(reportsQuery);
          reportsSnapshot.forEach(reportDoc => {
            reports.push({ id: reportDoc.id, ...reportDoc.data() } as TestReport);
          });
        }

        setAllReports(reports);
      } catch (e: any) {
        console.error("Error fetching reports: ", e);
        // This is a good place to show a toast or an error message to the user
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [firestore, user]);
  
  if (isLoading || !allReports) {
    return <div>Loading Dashboard...</div>
  }

  const totalReports = allReports.length;
  const totalFees = allReports.reduce((acc, report) => acc + report.governmentFee, 0);
  const domesticReports = allReports.filter(r => r.category === 'Domestic').length;
  const commercialReports = allReports.filter(r => r.category === 'Commercial').length;
  const industrialReports = allReports.filter(r => r.category === 'Industrial').length;

  const chartData: { category: string, count: number, fill: string }[] = [
    { category: 'Domestic', count: domesticReports, fill: 'var(--color-domestic)' },
    { category: 'Commercial', count: commercialReports, fill: 'var(--color-commercial)' },
    { category: 'Industrial', count: industrialReports, fill: 'var(--color-industrial)' },
  ];

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Reports"
          value={totalReports}
          icon={FileText}
          description="Total number of reports filed"
        />
        <StatCard 
          title="Total Fees Collected"
          value={`Rs ${totalFees.toLocaleString()}`}
          icon={IndianRupee}
          description="Sum of all government fees"
        />
        <StatCard 
          title="Domestic Reports"
          value={domesticReports}
          icon={Home}
          description="Total domestic connections"
        />
        <StatCard 
          title="Commercial & Industrial"
          value={commercialReports + industrialReports}
          icon={Building2}
          description="Total business connections"
        />
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <CategoryChart data={chartData} />
        <RecentReports reports={allReports as TestReport[]} />
      </div>
    </div>
  );
}
