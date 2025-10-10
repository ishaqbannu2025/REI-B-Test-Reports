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
      const date = new Date(row.getValue("entryDate"))
      return <div>{date.toLocaleDateString()}</div>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const report = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <Link href={`/dashboard/reports/${report.id}`}>
                <DropdownMenuItem>
                View Details & Print
                </DropdownMenuItem>
            </Link>
            <DropdownMenuItem>Edit Report</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Delete Report</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
