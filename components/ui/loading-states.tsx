'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Simple spinner component for indicating loading states
 */
export function LoadingSpinner({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div className={cn('inline-flex', sizeClasses[size], className)}>
      <svg
        className="animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  )
}

/**
 * Loading overlay with spinner and message
 */
export function LoadingOverlay({
  isLoading,
  message = 'Loading...',
  children,
}: {
  isLoading: boolean
  message?: string | React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 dark:bg-background/70 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center gap-3 z-50">
          <LoadingSpinner size="md" className="text-primary" />
          {message && (
            <p className="text-sm font-medium text-muted-foreground">{message}</p>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Button with integrated loading state
 */
export function LoadingButton({
  isLoading,
  disabled,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean
}) {
  return (
    <button
      disabled={isLoading || disabled}
      className="inline-flex items-center justify-center gap-2"
      {...props}
    >
      {isLoading && <LoadingSpinner size="sm" />}
      {children}
    </button>
  )
}

/**
 * Skeleton loader for placeholder content
 */
export function SkeletonLoader({
  count = 1,
  height = 'h-4',
  className,
}: {
  count?: number
  height?: string
  className?: string
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'bg-muted rounded-md animate-pulse',
            height
          )}
        />
      ))}
    </div>
  )
}
