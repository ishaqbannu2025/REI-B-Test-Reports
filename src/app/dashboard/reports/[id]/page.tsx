'use client';
import { notFound, useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/logo';
import { useFirebase, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { TestReport } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id: reportId } = params; // This is the document ID
  const { firestore } = useFirebase();
  const { user } = useUser();
  const [report, setReport] = useState<TestReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!firestore || !user || typeof reportId !== 'string') {
        setIsLoading(false);
        return;
    }

    const findReport = async () => {
      setIsLoading(true);
      // We assume the user can only view their own reports.
      // This is enforced by security rules.
      const reportRef = doc(firestore, 'users', user.uid, 'testReports', reportId);
      
      try {
        const docSnap = await getDoc(reportRef);
        if (docSnap.exists()) {
          setReport({...(docSnap.data() as TestReport), id: docSnap.id });
        } else {
          // If it doesn't exist in the user's collection, try a public query.
          // This path might be for public verification or an admin viewing another user's report.
          // For simplicity now, we just assume not found if not in user's own reports.
          setReport(null);
        }
      } catch (error) {
        const contextualError = new FirestorePermissionError({
          operation: 'get',
          path: reportRef.path,
        });
        errorEmitter.emit('permission-error', contextualError);
        setReport(null);
      } finally {
        setIsLoading(false);
      }
    };

    findReport();
  }, [firestore, reportId, user]);


  if (isLoading) {
    return <div>Loading report...</div>;
  }

  if (!report) {
    notFound();
  }
  
  const handlePrint = () => {
    window.print();
  }

  const getReportDate = (date: Date | Timestamp | string) => {
    if(date instanceof Timestamp) {
      return date.toDate().toLocaleDateString();
    }
    return new Date(date).toLocaleDateString();
  }

  return (
    <div className="max-w-4xl mx-auto">
        <style>{`
            @media print {
                body, .print-container {
                  background: white;
                }
                body * {
                    visibility: hidden;
                }
                #print-section, #print-section * {
                    visibility: visible;
                }
                #print-section {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    margin: 0;
                    padding: 0;
                }
                .no-print {
                  display: none;
                }
            }
        `}</style>
      <div className="flex justify-between items-center mb-4 no-print">
        <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4"/>
            Back to Reports
        </Button>
        <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4"/>
            Print Report
        </Button>
      </div>
      <Card id="print-section" className="p-2 sm:p-6 print-container">
        <CardHeader className="text-center border-b pb-6">
            <div className="flex items-center justify-center gap-4">
                <Logo className="h-20 w-20" />
                <div>
                    <h1 className="text-2xl font-bold text-primary">Regional Electric Inspectorate, Bannu</h1>
                    <p className="text-muted-foreground">Energy & Power Department, Government of Khyber Pakhtunkhwa</p>
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

    