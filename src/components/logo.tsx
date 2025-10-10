import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={cn("h-8 w-8 text-primary", className)}
      aria-label="Department Logo"
    >
      <g fill="currentColor">
        <path d="M50,10a40,40 0 1,0 0,80a40,40 0 1,0 0,-80" fill="none" stroke="currentColor" strokeWidth="4" />
        <path d="M50,20l-15,30h30z" />
        <path d="M30,80 q20,-20 40,0" fill="none" stroke="currentColor" strokeWidth="3" />
        <circle cx="50" cy="50" r="5" />
      </g>
    </svg>
  );
}
