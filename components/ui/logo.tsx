"use client"

import { cn } from "@/lib/utils"

interface LogoIconProps {
  className?: string
}

/**
 * Future Cashflow Logo Icon
 * Reusable SVG logo component for consistent branding
 */
export function LogoIcon({ className = "h-8 w-8 text-primary" }: LogoIconProps) {
  return (
    <div className="relative">
      <svg 
        aria-hidden="true" 
        className={cn("h-8 w-8 text-primary", className)} 
        fill="currentColor" 
        viewBox="0 0 80 80"
      >
        <path d="M40 8L16 32H26L40 18L54 32H64L40 8Z" />
        <path d="M40 28L16 52H26L40 38L54 52H64L40 28Z" />
      </svg>
    </div>
  )
}

interface LogoProps {
  className?: string
  iconClassName?: string
  showText?: boolean
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: { icon: "h-6 w-6", text: "text-lg" },
  md: { icon: "h-8 w-8", text: "text-xl" },
  lg: { icon: "h-10 w-10", text: "text-2xl" },
}

/**
 * Full Logo with Icon and Text
 * Use for headers and prominent branding
 */
export function Logo({ 
  className, 
  iconClassName, 
  showText = true, 
  size = "md" 
}: LogoProps) {
  const sizes = sizeClasses[size]
  
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoIcon className={cn(sizes.icon, "text-primary", iconClassName)} />
      {showText && (
        <span className={cn(sizes.text, "font-bold text-primary")}>
          Future Cashflow
        </span>
      )}
    </div>
  )
}
