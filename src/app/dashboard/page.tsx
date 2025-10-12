'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/firebase';
import { PlusCircle, BookCopy, BarChart2 } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useUser();

  return (
    <div className="flex flex-col gap-8">
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="text-3xl">
            Welcome, {user?.displayName || 'User'}!
          </CardTitle>
          <CardDescription>
            What would you like to do today?
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg">
                <Link href="/dashboard/reports/new">
                    <PlusCircle className="mr-2"/>
                    Add New Report
                </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
                <Link href="/dashboard/reports">
                    <BookCopy className="mr-2"/>
                    View All Reports
                </Link>
            </Button>
             <Button asChild size="lg" variant="outline">
                <Link href="/dashboard/analytics">
                    <BarChart2 className="mr-2"/>
                    View Analytics
                </Link>
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
