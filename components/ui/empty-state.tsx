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
 iconBg: "bg-success-bg/10",
 icon: "text-success",
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
 <div className={cn("px-4 py-16 text-center", className)}>
 {Icon && (
 <div className={cn("inline-flex justify-center items-center mb-6 rounded-2xl w-20 h-20 animate-in fade-in zoom-in-50", styles.iconBg)}>
 <Icon className={cn("w-10 h-10", styles.icon)} />
 </div>
 )}
 <h3 className="mb-2 font-semibold text-foreground text-lg tracking-tight">{title}</h3>
 {description && (
 <p className="mx-auto mb-8 max-w-sm text-muted-foreground text-sm leading-relaxed">{description}</p>
 )}
 {children && (
 <div className="flex flex-wrap justify-center gap-3">
 {children}
 </div>
 )}
 </div>
 )
}
