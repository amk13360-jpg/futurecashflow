import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'border-primary/20 bg-primary/10 text-primary [a&]:hover:bg-primary/20',
        secondary:
          'border-secondary bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/80',
        destructive:
          'border-error/20 bg-error/10 text-error [a&]:hover:bg-error/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
        success:
          'border-success/20 bg-success/10 text-success [a&]:hover:bg-success/20',
        warning:
          'border-warning/20 bg-warning/10 text-warning [a&]:hover:bg-warning/20',
        info:
          'border-info/20 bg-info/10 text-info [a&]:hover:bg-info/20',
        outline:
          'border-border text-foreground bg-transparent [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
