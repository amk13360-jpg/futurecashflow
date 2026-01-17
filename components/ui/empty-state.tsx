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
    <div className={cn("py-16 px-4 text-center", className)}>
      {Icon && (
        <div className={cn("inline-flex justify-center items-center mb-6 rounded-2xl w-20 h-20 animate-in fade-in zoom-in-50", styles.iconBg)}>
          <Icon className={cn("w-10 h-10", styles.icon)} />
        </div>
      )}
      <h3 className="mb-2 font-semibold text-foreground text-lg tracking-tight">{title}</h3>
      {description && (
        <p className="mb-8 text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">{description}</p>
      )}
      {children && (
        <div className="flex justify-center gap-3 flex-wrap">
          {children}
        </div>
      )}
    </div>
  )
}
