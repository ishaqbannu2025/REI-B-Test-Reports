import { testReports } from "@/lib/data";
import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";

export default function ViewReportsPage() {
  return (
    <div>
        <h1 className="text-2xl font-semibold mb-4">Test Reports</h1>
        <DataTable columns={columns} data={testReports} />
    </div>
  );
}
