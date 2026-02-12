'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
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
      toastOptions={{
        classNames: {
          toast:
            'group toast border shadow-lg rounded-lg px-4 py-3 text-sm font-medium',
          title: 'font-semibold',
          description: 'opacity-90 text-sm',
        },
        style: {
          // Default (non-typed) toast
          background: 'var(--popover)',
          color: 'var(--popover-foreground)',
          borderColor: 'var(--border)',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
