'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="group toaster"
      position="top-center"
      richColors
      duration={5000}
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
            'group toast border shadow-lg rounded-lg px-4 py-3 text-sm font-medium !text-white',
          title: 'font-semibold !text-white',
          description: 'opacity-90 text-sm !text-white',
          error:
            '!bg-[#dc2626] !text-white !border-[#dc2626]',
          success:
            '!bg-[#16a34a] !text-white !border-[#16a34a]',
          warning:
            '!bg-[#ca8a04] !text-white !border-[#ca8a04]',
          info:
            '!bg-[#2563eb] !text-white !border-[#2563eb]',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
