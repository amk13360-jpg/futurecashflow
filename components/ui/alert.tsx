import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const alertVariants = cva(
  'relative items-start gap-y-0.5 has-[>svg]:gap-x-3 grid grid-cols-[0_1fr] has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] px-4 py-3 border rounded-lg w-full [&>svg]:size-4 [&>svg]:text-current text-sm [&>svg]:translate-y-0.5',
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground border-border',
        destructive:
          'bg-error-bg border-error-border text-error [&>svg]:text-error *:data-[slot=alert-description]:text-error/80',
        success:
          'bg-success-bg border-success-border text-success [&>svg]:text-success *:data-[slot=alert-description]:text-success/80',
        warning:
          'bg-warning-bg border-warning-border text-warning [&>svg]:text-warning *:data-[slot=alert-description]:text-warning/80',
        info:
          'bg-info-bg border-info-border text-info [&>svg]:text-info *:data-[slot=alert-description]:text-info/80',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        'col-start-2 min-h-4 font-medium line-clamp-1 tracking-tight',
        className,
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'justify-items-start gap-1 grid col-start-2 text-muted-foreground text-sm [&_p]:leading-relaxed',
        className,
      )}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }
