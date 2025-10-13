'use client';

import { StatCard } from '../components/stat-card';
import { CategoryChart } from '../components/category-chart';
import { RecentReports } from '../components/recent-reports';
import { Home, Building2, FileText, IndianRupee } from 'lucide-react';
import type { TestReport } from '@/lib/types';
import { useFirebase, useUser } from '@/firebase';
import { query, orderBy, getDocs, collectionGroup, collection } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FirestorePermissionError, errorEmitter } from '@/firebase';

export default function AnalyticsPage() {
  const { firestore, user } = useFirebase();
  const [allReports, setAllReports] = useState<TestReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      if (!user || !firestore) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // We will always attempt the collectionGroup query.
        // Security rules will determine if the user has permission.
        const reportsQuery = query(collectionGroup(firestore, 'testReports'), orderBy('entryDate', 'desc'));
        const querySnapshot = await getDocs(reportsQuery);
        
        const reports: TestReport[] = querySnapshot.docs.map(reportDoc => ({
          id: reportDoc.id,
          ...reportDoc.data()
        } as TestReport));
        
        setAllReports(reports);

      } catch (error) {
        // If the admin query fails, assume it's a non-admin and fetch their own reports
        try {
            const userReportsQuery = query(collection(firestore, 'users', user.uid, 'testReports'), orderBy('entryDate', 'desc'));
            const userQuerySnapshot = await getDocs(userReportsQuery);
            const userReports: TestReport[] = userQuerySnapshot.docs.map(reportDoc => ({
                id: reportDoc.id,
                ...reportDoc.data()
            } as TestReport));
            setAllReports(userReports);
        } catch (userError) {
             console.error("Error fetching reports for analytics:", userError);
             const contextualError = new FirestorePermissionError({
               operation: 'list',
               path: 'testReports (collection group)',
             });
             errorEmitter.emit('permission-error', contextualError);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReports();

  }, [user, firestore]);
  
  if (isLoading) {
    return <div>Loading Analytics...</div>
  }

  const totalReports = allReports.length;
  const totalFees = allReports.reduce((acc, report) => acc + (report.governmentFee || 0), 0);
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
        <StatCard _title="Commercial & Industrial"
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
