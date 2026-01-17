'use client'

import * as React from 'react'
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type FeedbackType = 'success' | 'error' | 'warning' | 'info'

interface FeedbackBannerProps {
  type: FeedbackType
  title?: string
  message: string
  description?: string
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
}

const feedbackStyles = {
  success: {
    container: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
    icon: 'text-emerald-600 dark:text-emerald-400',
    title: 'text-emerald-900 dark:text-emerald-100',
    message: 'text-emerald-800 dark:text-emerald-200',
  },
  error: {
    container: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400',
    title: 'text-red-900 dark:text-red-100',
    message: 'text-red-800 dark:text-red-200',
  },
  warning: {
    container: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
    icon: 'text-amber-600 dark:text-amber-400',
    title: 'text-amber-900 dark:text-amber-100',
    message: 'text-amber-800 dark:text-amber-200',
  },
  info: {
    container: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    title: 'text-blue-900 dark:text-blue-100',
    message: 'text-blue-800 dark:text-blue-200',
  },
}

const iconMap = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

export function FeedbackBanner({
  type,
  title,
  message,
  description,
  dismissible = true,
  onDismiss,
  className,
}: FeedbackBannerProps) {
  const [isVisible, setIsVisible] = React.useState(true)

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  if (!isVisible) return null

  const styles = feedbackStyles[type]
  const Icon = iconMap[type]

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 border rounded-lg',
        'transition-all duration-200 animate-in fade-in slide-in-from-top-2',
        styles.container,
        className
      )}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <Icon className={cn('flex-shrink-0 mt-0.5 w-5 h-5', styles.icon)} />
      
      <div className="flex-1 min-w-0">
        {title && (
          <h3 className={cn('mb-1 font-semibold text-sm', styles.title)}>
            {title}
          </h3>
        )}
        <p className={cn('text-sm', styles.message)}>
          {message}
        </p>
        {description && (
          <p className={cn('opacity-90 mt-1 text-xs', styles.message)}>
            {description}
          </p>
        )}
      </div>

      {dismissible && (
        <button
          onClick={handleDismiss}
          className={cn(
            'flex-shrink-0 p-1.5 rounded-md transition-colors',
            'hover:bg-black/10 dark:hover:bg-white/10',
            'focus-visible:outline-2 focus-visible:outline-offset-2'
          )}
          aria-label="Dismiss message"
        >
          <X className="opacity-60 hover:opacity-100 w-4 h-4" />
        </button>
      )}
    </div>
  )
}

// Utility component for form-specific feedback
export function FieldFeedback({
  isError,
  message,
}: {
  isError: boolean
  message: string
}) {
  if (!message) return null

  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2 rounded-md font-medium text-xs',
        isError
          ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300'
          : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
      )}
      role={isError ? 'alert' : 'status'}
    >
      {isError ? (
        <AlertCircle className="w-4 h-4" />
      ) : (
        <CheckCircle2 className="w-4 h-4" />
      )}
      {message}
    </div>
  )
}
