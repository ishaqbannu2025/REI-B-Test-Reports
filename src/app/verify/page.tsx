'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import type { TestReport } from '@/lib/types';
import Link from 'next/link';
import { useFirebase } from '@/firebase';
import { collectionGroup, query, where, getDocs, Timestamp } from 'firebase/firestore';

export default function VerifyPage() {
  const [uin, setUin] = useState('');
  const [report, setReport] = useState<TestReport | null>(null);
  const [searched, setSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { firestore } = useFirebase();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !uin) return;

    setIsLoading(true);
    setSearched(true);
    setReport(null);

    // Use a collection group query to search for the UIN across all users' reports.
    const reportsRef = collectionGroup(firestore, 'testReports');
    const q = query(reportsRef, where('uin', '==', uin));

    try {
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const reportDoc = querySnapshot.docs[0];
        // Firestore timestamps need to be converted to JS Dates for display
        const data = reportDoc.data() as TestReport;
        
        // Ensure entryDate is a JS Date
        const entryDate = data.entryDate instanceof Timestamp ? data.entryDate.toDate() : new Date(data.entryDate as any);

        setReport({ ...data, id: reportDoc.id, entryDate });
      } else {
        setReport(null);
      }
    } catch (error) {
      console.error('Error searching for report:', error);
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="absolute top-8 text-center">
        <h1 className="text-2xl font-bold text-primary">Regional Electric Inspectorate, Bannu</h1>
        <p className="text-muted-foreground">
          Energy & Power Department, Government of Khyber Pakhtunkhwa
        </p>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mx-auto mb-2">
            <Logo className="h-12 w-12" />
          </div>
          <CardTitle>Public Report Verification</CardTitle>
          <CardDescription>
            Enter the Unique Identification Number (UIN) to verify a test report.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSearch}>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="uin">UIN</Label>
                <Input
                  id="uin"
                  placeholder="e.g., REI-BNU-2025-0012"
                  value={uin}
                  onChange={(e) => setUin(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify Report'}
            </Button>
            <div className="text-center text-sm">
              Staff Login?{' '}
              <Link href="/" className="underline">
                Go to Dashboard
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>

      {searched && (
        <Card className="w-full max-w-md mt-6">
          <CardHeader>
            <CardTitle>{report ? 'Report Found' : 'Report Not Found'}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <p>Searching...</p>
            ) : report ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <p className="font-semibold">Applicant Name:</p>
                <p>{report.applicantName}</p>

                <p className="font-semibold">Category:</p>
                <p>{report.category}</p>

                <p className="font-semibold">District:</p>
                <p>{report.district}</p>

                <p className="font-semibold">Entry Date:</p>
                <p>{report.entryDate.toLocaleDateString()}</p>

                <p className="font-semibold">Status:</p>
                <p className="text-green-600 font-semibold">Verified</p>
              </div>
            ) : (
              <p>
                No report found for the UIN:{' '}
                <span className="font-mono bg-muted px-2 py-1 rounded">{uin}</span>. Please check
                the number and try again.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
