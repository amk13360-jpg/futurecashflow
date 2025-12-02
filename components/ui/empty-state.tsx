import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

type EmptyStateVariant = "default" | "success"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
  variant?: EmptyStateVariant
}

const variantStyles: Record<EmptyStateVariant, { iconBg: string; icon: string }> = {
  default: {
    iconBg: "bg-muted",
    icon: "text-muted-foreground",
  },
  success: {
    iconBg: "bg-emerald-500/10",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  children,
  className,
  variant = "default"
}: EmptyStateProps) {
  const styles = variantStyles[variant]
  
  return (
    <div className={cn("py-12 text-center", className)}>
      {Icon && (
        <div className={cn("inline-flex justify-center items-center mb-6 rounded-2xl w-16 h-16", styles.iconBg)}>
          <Icon className={cn("w-8 h-8", styles.icon)} />
        </div>
      )}
      <h3 className="mb-2 font-semibold text-foreground text-lg">{title}</h3>
      {description && (
        <p className="mb-6 text-muted-foreground text-sm max-w-sm mx-auto">{description}</p>
      )}
      {children && (
        <div className="flex justify-center gap-4">
          {children}
        </div>
      )}
    </div>
  )
}
