import { users } from "@/lib/data";
import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react";

export default function UsersPage() {
  return (
    <div>
        <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold">User Management</h1>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add User
            </Button>
        </div>
        <DataTable columns={columns} data={users} />
    </div>
  );
}
