"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Logo } from '@/components/logo';

type Report = any;

export default function ReportDetailClient({ params }: { params: { id: string } }) {
  const { id: uin } = params;
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/get-report?uin=${encodeURIComponent(uin)}`);
        if (res.status === 404) {
          router.replace('/dashboard/reports');
          return;
        }
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error || 'Failed to fetch report');
        }
        const data = await res.json();
        setReport(data);
      } catch (err: any) {
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [uin, router]);

  if (loading) return <div>Loading report...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;
  if (!report) return <div>Report not found.</div>;

  const getReportDate = (date: any) => {
    if (!date) return '';
    if (typeof date === 'string') return new Date(date).toLocaleDateString();
    if (date?.seconds) return new Date(date.seconds * 1000).toLocaleDateString();
    if (date instanceof Date) return date.toLocaleDateString();
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
              <span className="text-base">Rs {Number(report.governmentFee || 0).toLocaleString()}</span>
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
