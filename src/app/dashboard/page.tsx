'use client';

import { StatCard } from './components/stat-card';
import { CategoryChart } from './components/category-chart';
import { RecentReports } from './components/recent-reports';
import { Home, Factory, Building2, FileText, IndianRupee } from 'lucide-react';
import type { TestReport } from '@/lib/types';
import { useFirebase, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, orderBy, getDocs, collectionGroup, doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const [allReports, setAllReports] = useState<TestReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!firestore || !user) return;

    const checkAdminStatus = async () => {
      try {
        const idTokenResult = await user.getIdTokenResult();
        setIsAdmin(idTokenResult.claims.role === 'Admin');
      } catch (e) {
        console.error("Error checking admin status:", e);
        setIsAdmin(false); // Default to non-admin on error
      } finally {
        // We set loading to false here, so the next effect can run
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [firestore, user]);


  useEffect(() => {
    // This effect should wait until the admin check is complete
    if (isLoading || !firestore || !user) return;

    const fetchReports = () => {
      let reportsQuery;
      
      if (isAdmin) {
        // Admin: Query all reports in the collection group
        reportsQuery = query(collectionGroup(firestore, 'testReports'), orderBy('entryDate', 'desc'));
      } else {
        // Non-Admin: Query only their own reports
        reportsQuery = query(collection(firestore, `users/${user.uid}/testReports`), orderBy('entryDate', 'desc'));
      }
      
      getDocs(reportsQuery)
        .then(querySnapshot => {
            const reports: TestReport[] = [];
            querySnapshot.forEach(reportDoc => {
                reports.push({ id: reportDoc.id, ...reportDoc.data() } as TestReport);
            });
            setAllReports(reports);
        })
        .catch(serverError => {
            const path = isAdmin ? 'testReports' : `users/${user.uid}/testReports`;
            const permissionError = new FirestorePermissionError({
              operation: 'list',
              path: path,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    };

    fetchReports();
  }, [firestore, user, isAdmin, isLoading]);
  
  if (isLoading && allReports.length === 0) {
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
