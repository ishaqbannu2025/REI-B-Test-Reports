"use client"

import { ColumnDef } from "@tanstack/react-table"
import { TestReport, TestReportCategory } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { Timestamp, doc } from "firebase/firestore"
import { DateRange } from "react-day-picker"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteDocumentNonBlocking, useFirebase } from "@/firebase"
import { useToast } from "@/hooks/use-toast"
import React from "react"
import { useRouter } from "next/navigation"


const ReportActions = ({ report }: { report: TestReport }) => {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = () => {
    if (!firestore) return;

    // Reports are stored at /users/{userId}/testReports/{reportId}
    const reportRef = doc(firestore, `users/${report.enteredBy}/testReports/${report.id}`);
    
    // We use the non-blocking delete function which handles errors via the global emitter.
    deleteDocumentNonBlocking(reportRef);

    toast({
      title: "Report Deletion Scheduled",
      description: `Report with UIN ${report.uin} will be deleted.`,
    });

    // We can rely on the real-time listener on the reports page to update the UI.
    // Or force a refresh if listeners are not used everywhere.
    router.refresh();
  };

  const handleEdit = () => {
    // The link should point to the document ID, not the UIN.
    router.push(`/dashboard/reports/${report.id}/edit`);
  };

  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem asChild>
             {/* The link should point to the document ID, not the UIN. */}
            <Link href={`/dashboard/reports/${report.id}`}>
              View Details & Print
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEdit}>Edit Report</DropdownMenuItem>
          <DropdownMenuSeparator />
          <AlertDialogTrigger asChild>
            <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
              Delete Report
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the test report with UIN <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{report.uin}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};


export const columns: ColumnDef<TestReport>[] = [
  {
    accessorKey: "uin",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        UIN
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "applicantName",
    header: "Applicant Name",
  },
  {
    accessorKey: "shortAddress",
    header: "Short Address",
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const category = row.getValue("category") as TestReportCategory;
      return <Badge variant={
        category === 'Domestic' ? 'secondary' :
        category === 'Commercial' ? 'outline' : 'default'
      }>{category}</Badge>;
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "district",
    header: "District",
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "sanctionedLoad",
    header: "Sanction Load",
  },
  {
    accessorKey: "governmentFee",
    header: () => <div className="text-right">Fee (Rs)</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("governmentFee"));
      const formatted = new Intl.NumberFormat("en-IN").format(amount);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "challanNo",
    header: "Challan No.",
  },
  {
    accessorKey: "challanDate",
    header: "Challan Date",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const report = row.original
      return <ReportActions report={report} />
    },
  },
]
