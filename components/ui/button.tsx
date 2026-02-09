import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:ring-offset-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: 'border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:border-primary/90 active:bg-primary/80',
        destructive:
          'border-destructive bg-destructive text-white shadow-sm hover:bg-destructive/90 hover:border-destructive/90 active:bg-destructive/80 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:border-accent active:bg-accent/80 dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary:
          'border-secondary bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:border-secondary/80 active:bg-secondary/70',
        ghost:
          'border-transparent hover:bg-accent hover:text-accent-foreground hover:border-accent/50 active:bg-accent/80 dark:hover:bg-accent/50',
        link: 'border-transparent text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 min-h-[40px] px-4 py-2 has-[>svg]:px-3',
        sm: 'h-9 min-h-[36px] gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-11 min-h-[44px] px-6 has-[>svg]:px-4',
        xl: 'h-12 min-h-[48px] px-8 text-base has-[>svg]:px-6',
        icon: 'size-10 min-h-[40px] min-w-[40px]',
        'icon-sm': 'size-9 min-h-[36px] min-w-[36px]',
        'icon-lg': 'size-11 min-h-[44px] min-w-[44px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
