import { cn } from "@/lib/utils"
import { ShieldCheck } from "lucide-react";

export function Logo({ className }: { className?: string }) {
  return (
    <ShieldCheck className={cn("h-8 w-8 text-primary", className)} />
  );
}
