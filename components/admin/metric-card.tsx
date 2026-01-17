import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type MetricVariant = "default" | "success" | "warning" | "info" | "primary"

interface MetricCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  variant?: MetricVariant
  trend?: {
    value: number
    label: string
    isPositive?: boolean
  }
}

const variantStyles: Record<MetricVariant, { card: string; icon: string; iconBg: string }> = {
  default: {
    card: "",
    icon: "text-muted-foreground",
    iconBg: "bg-muted",
  },
  success: {
    card: "border-emerald-500/20",
    icon: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-500/10",
  },
  warning: {
    card: "border-amber-500/20",
    icon: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-500/10",
  },
  info: {
    card: "border-blue-500/20",
    icon: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-500/10",
  },
  primary: {
    card: "border-primary/20",
    icon: "text-primary",
    iconBg: "bg-primary/10",
  },
}

export function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  variant = "default",
  trend 
}: MetricCardProps) {
  const styles = variantStyles[variant]
  
  return (
    <Card className={cn("border-l-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1", styles.card)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</CardTitle>
        <div className={cn("p-2.5 rounded-lg transition-transform duration-300", styles.iconBg)}>
          <Icon className={cn("h-5 w-5", styles.icon)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{description}</p>}
        {trend && (
          <div className={cn(
            "flex items-center gap-1.5 mt-3 text-xs font-semibold",
            trend.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
          )}>
            <span className="text-sm">{trend.isPositive ? "↑" : "↓"}</span>
            <span>{Math.abs(trend.value)}%</span>
            <span className="text-muted-foreground font-normal">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
