import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BarChart2 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports & Analytics</CardTitle>
        <CardDescription>
          Detailed analytics and reporting tools.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center text-center gap-4 min-h-[400px]">
        <BarChart2 className="w-16 h-16 text-muted-foreground" />
        <h3 className="text-xl font-semibold">Analytics Page Under Construction</h3>
        <p className="text-muted-foreground">
          This page will provide in-depth charts, data exports, and filtering options.
        </p>
      </CardContent>
    </Card>
  );
}
