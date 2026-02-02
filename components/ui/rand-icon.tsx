import type { LucideProps } from "lucide-react"
import { cn } from "@/lib/utils"

export function RandIcon({ className, ...props }: LucideProps) {
  return (
    <span
      {...props}
      className={cn("inline-flex items-center justify-center font-bold leading-none", className)}
      aria-hidden="true"
    >
      R
    </span>
  )
}
