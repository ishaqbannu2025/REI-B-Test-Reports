
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
    // report.id is the UIN, which is used as the document ID.
    // report.enteredBy is the userId.
    const reportRef = doc(firestore, `users/${report.enteredBy}/testReports/${report.id}`);
    
    deleteDocumentNonBlocking(reportRef);

    toast({
      title: "Report Deleted",
      description: `Report with UIN ${report.uin} has been scheduled for deletion.`,
    });
  };

  const handleEdit = () => {
    router.push(`/dashboard/reports/${report.uin}/edit`);
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
            <Link href={`/dashboard/reports/${report.uin}`}>
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
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          UIN
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "applicantName",
    header: "Applicant Name",
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const category = row.getValue("category") as TestReportCategory
      return <Badge variant={
        category === 'Domestic' ? 'secondary' :
        category === 'Commercial' ? 'outline' : 'default'
      }>{category}</Badge>
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "district",
    header: "District",
     filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "governmentFee",
    header: () => <div className="text-right">Fee (Rs)</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("governmentFee"))
      const formatted = new Intl.NumberFormat("en-IN").format(amount)
      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "entryDate",
    header: "Entry Date",
    cell: ({ row }) => {
      const dateValue = row.getValue("entryDate");
      // Firestore Timestamps can come in as objects, so we need to convert them.
      const date = (dateValue as any).toDate ? (dateValue as any).toDate() : new Date(dateValue as string);
      return <div>{date.toLocaleDateString()}</div>
    },
    filterFn: (row, id, value) => {
      const date = (row.getValue(id) as any).toDate ? (row.getValue(id) as any).toDate() : new Date(row.getValue(id) as string);
      const { from, to } = value as DateRange;
      if (from && !to) {
        return date >= from;
      } else if (!from && to) {
        return date <= to;
      } else if (from && to) {
        return date >= from && date <= to;
      }
      return true;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const report = row.original
      return <ReportActions report={report} />
    },
  },
]
