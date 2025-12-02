import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('bg-muted rounded-md animate-pulse', className)}
      {...props}
    />
  )
}

function SkeletonCard() {
  return (
    <div className="bg-card p-6 border rounded-lg">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="w-24 h-4" />
          <Skeleton className="w-16 h-8" />
        </div>
        <Skeleton className="rounded-full w-12 h-12" />
      </div>
    </div>
  )
}

function SkeletonMetricCard() {
  return (
    <div className="bg-card shadow-xl p-6 border rounded-lg">
      <div className="flex justify-between items-center">
        <div className="space-y-3">
          <Skeleton className="w-28 h-4" />
          <Skeleton className="w-20 h-10" />
        </div>
        <Skeleton className="rounded-lg w-12 h-12" />
      </div>
    </div>
  )
}

function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="w-full h-10" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="w-full h-16" />
      ))}
    </div>
  )
}

export { Skeleton, SkeletonCard, SkeletonMetricCard, SkeletonTable }
