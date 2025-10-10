import { cn } from "@/lib/utils"
import Image from "next/image";

export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/kp-logo.png"
      alt="Government of Khyber Pakhtunkhwa"
      width={100}
      height={100}
      className={cn("h-8 w-8", className)}
    />
  );
}
