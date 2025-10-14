import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import type { TestReport } from '@/lib/types';
import { testReports } from '@/lib/data';

// Required for static export: generateStaticParams
export async function generateStaticParams() {
  // TODO: Replace with actual UINs from your data source
  return [
    { id: 'REI-BNU-2025-0012' },
    { id: 'REI-BNU-2025-0013' },
    // Add more UINs as needed
  ];
}

function ReportDetailPage({ params }: { params: { id: string } }) {
  // For static export, use static data only
  const report = testReports.find((r) => r.uin === params.id);
  if (!report) {
    notFound();
  }
  const getReportDate = (date: Date | string | { toDate?: () => Date }) => {
    if (typeof date === 'string') return new Date(date).toLocaleDateString();
    if (date instanceof Date) return date.toLocaleDateString();
    if (typeof date === 'object' && date && typeof date.toDate === 'function') return date.toDate().toLocaleDateString();
    return '';
  };
  return (
    <div className="max-w-4xl mx-auto">
      <Card id="print-section" className="p-2 sm:p-6 print-container">
        <CardHeader className="text-center border-b pb-6">
          <div className="flex items-center justify-center gap-4">
            <Logo className="h-20 w-20" />
            <div>
              <CardTitle>Regional Electric Inspectorate, Bannu</CardTitle>
              <CardDescription>Energy & Power Department, Government of Khyber Pakhtunkhwa</CardDescription>
              <h2 className="text-xl font-semibold mt-2">Electrical Test Report</h2>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div className="flex flex-col">
              <span className="font-semibold text-muted-foreground">Unique Identification Number (UIN)</span>
              <span className="font-mono text-base">{report.uin}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-muted-foreground">Entry Date</span>
              <span className="text-base">{getReportDate(report.entryDate)}</span>
            </div>
            <div className="md:col-span-2 my-2 border-t"></div>
            <div className="flex flex-col">
              <span className="font-semibold text-muted-foreground">Applicant Name</span>
              <span className="text-base">{report.applicantName}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-muted-foreground">Short Address</span>
              <span className="text-base">{report.shortAddress}</span>
            </div>
            <div className="md:col-span-2 my-2 border-t"></div>
            <div className="flex flex-col">
              <span className="font-semibold text-muted-foreground">Category</span>
              <span className="text-base">{report.category}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-muted-foreground">Sanctioned Load</span>
              <span className="text-base">{report.sanctionedLoad}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-muted-foreground">Proposed Transformer</span>
              <span className="text-base">{report.proposedTransformer}</span>
            </div>
            <div className="md:col-span-2 my-2 border-t"></div>
            <div className="flex flex-col">
              <span className="font-semibold text-muted-foreground">Government Fee (Rs)</span>
              <span className="text-base">Rs {report.governmentFee.toLocaleString()}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-muted-foreground">Challan No. / Date</span>
              <span className="text-base">{report.challanNo} / {getReportDate(report.challanDate)}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-muted-foreground">Electrical Contractor</span>
              <span className="text-base">{report.electricalContractorName}</span>
            </div>
            <div className="md:col-span-2 my-2 border-t"></div>
            <div className="flex flex-col md:col-span-2">
              <span className="font-semibold text-muted-foreground">Remarks / Comments</span>
              <p className="text-base mt-1">{report.remarks || 'N/A'}</p>
            </div>
          </div>
          <div className="mt-24 pt-6 border-t flex justify-end">
            <div className="w-1/3 text-center">
              <div className="border-t-2 border-dotted border-foreground w-full mb-2"></div>
              <p className="font-semibold">Electric Inspector</p>
              <p className="text-xs text-muted-foreground">Signature & Stamp</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ReportDetailPage;
