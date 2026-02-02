import * as React from "react"
import type { LucideProps } from "lucide-react"
import { cn } from "@/lib/utils"

export const RandIcon = React.forwardRef<SVGSVGElement, LucideProps>(
  ({ className, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("lucide", className)}
        {...props}
      >
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          fill="currentColor"
          stroke="none"
          fontSize="16"
          fontWeight="bold"
        >
          R
        </text>
      </svg>
    )
  }
)

RandIcon.displayName = "RandIcon"
