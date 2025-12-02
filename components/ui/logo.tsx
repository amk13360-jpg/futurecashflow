"use client"

import { cn } from "@/lib/utils"

interface LogoIconProps {
  className?: string
}

/**
 * Future Cashflow Logo Icon
 * Reusable SVG logo component for consistent branding
 */
export function LogoIcon({ className = "h-10 w-10 text-blue-600" }: LogoIconProps) {
  return (
    <div className="relative">
      <svg 
        aria-hidden="true" 
        className={cn("w-10 h-10 text-blue-600", className)} 
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
  size?: "sm" | "md" | "lg" | "xl"
}

const sizeClasses = {
  sm: { icon: "h-8 w-8", text: "text-lg", divider: "h-5" },
  md: { icon: "h-10 w-10", text: "text-xl", divider: "h-6" },
  lg: { icon: "h-12 w-12", text: "text-2xl", divider: "h-8" },
  xl: { icon: "h-14 w-14", text: "text-3xl", divider: "h-10" },
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
      <LogoIcon className={cn(sizes.icon, "text-blue-600", iconClassName)} />
      {showText && (
        <>
          <span className={cn(sizes.text, "font-bold text-blue-600")}>Future</span>
          <div className={cn("bg-blue-600 w-px", sizes.divider)}></div>
          <span className={cn(sizes.text, "font-bold text-blue-600")}>Cashflow</span>
        </>
      )}
    </div>
  )
}
