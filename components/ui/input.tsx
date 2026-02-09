import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:inline-flex bg-background selection:bg-primary disabled:bg-muted dark:bg-input file:bg-transparent disabled:opacity-50 shadow-sm px-3 py-2 border border-input file:border-0 rounded-lg outline-none w-full min-w-0 h-10 file:h-7 min-h-10 file:font-medium selection:text-primary-foreground placeholder:text-muted-foreground file:text-foreground md:text-sm file:text-sm text-base transition-[color,box-shadow,border-color] disabled:cursor-not-allowed disabled:pointer-events-none',
        'hover:border-ring/50',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
