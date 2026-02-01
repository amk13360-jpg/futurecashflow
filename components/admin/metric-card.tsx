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
 card: "border-success-border",
 icon: "text-success",
 iconBg: "bg-success-bg",
 },
 warning: {
 card: "border-warning-border",
 icon: "text-warning",
 iconBg: "bg-warning-bg",
 },
 info: {
 card: "border-info-border",
 icon: "text-info",
 iconBg: "bg-info-bg",
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
 <Card className={cn("hover:shadow-lg border-l-4 hover:scale-[1.02] transition-all hover:-translate-y-1 duration-300", styles.card)}>
 <CardHeader className="flex flex-row justify-between items-center pb-2">
 <CardTitle className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">{title}</CardTitle>
 <div className={cn("p-2.5 rounded-lg transition-transform duration-300", styles.iconBg)}>
 <Icon className={cn("w-5 h-5", styles.icon)} />
 </div>
 </CardHeader>
 <CardContent>
 <div className="font-bold text-3xl tracking-tight">{value}</div>
 {description && <p className="mt-2 text-muted-foreground text-xs leading-relaxed">{description}</p>}
 {trend && (
 <div className={cn(
 "flex items-center gap-1.5 mt-3 font-semibold text-xs",
 trend.isPositive ? "text-success" : "text-error"
 )}>
 <span className="text-sm">{trend.isPositive ? "↑" : "↓"}</span>
 <span>{Math.abs(trend.value)}%</span>
 <span className="font-normal text-muted-foreground">{trend.label}</span>
 </div>
 )}
 </CardContent>
 </Card>
 )
}
