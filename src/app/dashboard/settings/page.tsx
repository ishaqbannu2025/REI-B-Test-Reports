import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>
          Manage your account settings and preferences.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center text-center gap-4 min-h-[400px]">
        <Settings className="w-16 h-16 text-muted-foreground" />
        <h3 className="text-xl font-semibold">Settings Page Under Construction</h3>
        <p className="text-muted-foreground">
          This page will allow you to change your password, update your profile, and manage notifications.
        </p>
      </CardContent>
    </Card>
  );
}
