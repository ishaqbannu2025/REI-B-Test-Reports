import { StatCard } from './components/stat-card';
import { CategoryChart } from './components/category-chart';
import { RecentReports } from './components/recent-reports';
import { testReports } from '@/lib/data';
import { Home, Factory, Building2, FileText, IndianRupee } from 'lucide-react';
import type { TestReport } from '@/lib/types';

export default function DashboardPage() {
  const totalReports = testReports.length;
  const totalFees = testReports.reduce((acc, report) => acc + report.governmentFee, 0);
  const domesticReports = testReports.filter(r => r.category === 'Domestic').length;
  const commercialReports = testReports.filter(r => r.category === 'Commercial').length;
  const industrialReports = testReports.filter(r => r.category === 'Industrial').length;

  const chartData: { category: string, count: number, fill: string }[] = [
    { category: 'Domestic', count: domesticReports, fill: 'var(--color-domestic)' },
    { category: 'Commercial', count: commercialReports, fill: 'var(--color-commercial)' },
    { category: 'Industrial', count: industrialReports, fill: 'var(--color-industrial)' },
  ];

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <CategoryChart data={chartData} />
        <RecentReports reports={testReports.slice(0, 5) as TestReport[]} />
      </div>
    </div>
  );
}
