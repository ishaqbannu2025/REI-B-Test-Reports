import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { TestReport } from "@/lib/types"

type RecentReportsProps = {
  reports: TestReport[];
}

export function RecentReports({ reports }: RecentReportsProps) {
  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>Recent Reports</CardTitle>
        <CardDescription>The 5 most recently added reports.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Applicant</TableHead>
              <TableHead className="hidden sm:table-cell">Category</TableHead>
              <TableHead className="text-right">Fee</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell>
                  <div className="font-medium">{report.applicantName}</div>
                  <div className="hidden text-sm text-muted-foreground md:inline">
                    {report.uin}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant={
                    report.category === 'Domestic' ? 'secondary' :
                    report.category === 'Commercial' ? 'outline' : 'default'
                  }>{report.category}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  Rs {report.governmentFee.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
