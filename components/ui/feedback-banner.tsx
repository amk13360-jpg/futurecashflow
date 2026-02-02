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
    container: 'bg-success-bg border-success-border',
    icon: 'text-success',
    title: 'text-success-foreground',
    message: 'text-success-foreground',
  },
  error: {
    container: 'bg-error-bg border-error-border',
    icon: 'text-error',
    title: 'text-error-foreground',
    message: 'text-error-foreground',
  },
  warning: {
    container: 'bg-warning-bg border-warning-border',
    icon: 'text-warning',
    title: 'text-warning-foreground',
    message: 'text-warning-foreground',
  },
  info: {
    container: 'bg-info-bg border-info-border',
    icon: 'text-info',
    title: 'text-info-foreground',
    message: 'text-info-foreground',
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
 ? 'bg-error-bg text-error-foreground'
 : 'bg-success-bg text-success-foreground'
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
