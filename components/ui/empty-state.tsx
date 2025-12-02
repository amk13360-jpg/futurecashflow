import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  children,
  className 
}: EmptyStateProps) {
  return (
    <div className={cn("py-12 text-center", className)}>
      {Icon && (
        <div className="inline-flex justify-center items-center bg-muted mb-6 rounded-2xl w-16 h-16">
          <Icon className="w-8 h-8 text-muted-foreground" />
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
