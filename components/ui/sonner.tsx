'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: 'border border-border bg-popover text-popover-foreground',
          title: 'text-inherit',
          description: 'text-inherit/90',
          success: 'bg-success text-white border border-success',
          warning: 'bg-warning text-white border border-warning',
          error: 'bg-error text-white border border-error',
          info: 'bg-info text-white border border-info',
        },
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--success-bg': 'var(--success)',
          '--success-text': '#ffffff',
          '--success-border': 'var(--success)',
          '--warning-bg': 'var(--warning)',
          '--warning-text': '#ffffff',
          '--warning-border': 'var(--warning)',
          '--error-bg': 'var(--error)',
          '--error-text': '#ffffff',
          '--error-border': 'var(--error)',
          '--info-bg': 'var(--info)',
          '--info-text': '#ffffff',
          '--info-border': 'var(--info)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
