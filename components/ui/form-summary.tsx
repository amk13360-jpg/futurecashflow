import * as React from "react"
import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FormErrorSummaryProps {
  errors: { field: string; message: string }[]
  title?: string
  className?: string
  onFieldClick?: (field: string) => void
}

export function FormErrorSummary({
  errors,
  title = "Please fix the following errors",
  className,
  onFieldClick
}: FormErrorSummaryProps) {
  if (errors.length === 0) return null

  return (
    <Alert variant="destructive" className={cn("mb-6", className)}>
      <XCircle className="h-4 w-4" />
      <AlertTitle className="font-semibold">{title}</AlertTitle>
      <AlertDescription>
        <ul className="mt-3 space-y-2 list-disc list-inside">
          {errors.map((error, index) => (
            <li key={index} className="text-sm">
              {onFieldClick ? (
                <button
                  type="button"
                  onClick={() => onFieldClick(error.field)}
                  className="hover:underline text-left focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-destructive rounded px-1"
                >
                  <span className="font-medium">{error.field}:</span> {error.message}
                </button>
              ) : (
                <>
                  <span className="font-medium">{error.field}:</span> {error.message}
                </>
              )}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}

interface FormSuccessSummaryProps {
  message: string
  description?: string
  className?: string
  onDismiss?: () => void
}

export function FormSuccessSummary({
  message,
  description,
  className,
  onDismiss
}: FormSuccessSummaryProps) {
  return (
    <Alert variant="default" className={cn("mb-6 border-success bg-success-bg", className)}>
      <CheckCircle2 className="h-4 w-4 text-success" />
      <AlertTitle className="text-success font-semibold">{message}</AlertTitle>
      {description && (
        <AlertDescription className="text-success-foreground/80">
          {description}
        </AlertDescription>
      )}
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-success/10"
        >
          <XCircle className="h-4 w-4" />
        </Button>
      )}
    </Alert>
  )
}

interface FormInfoSummaryProps {
  message: string
  description?: string
  className?: string
}

export function FormInfoSummary({
  message,
  description,
  className
}: FormInfoSummaryProps) {
  return (
    <Alert variant="default" className={cn("mb-6 border-info bg-info-bg", className)}>
      <Info className="h-4 w-4 text-info" />
      <AlertTitle className="text-info font-semibold">{message}</AlertTitle>
      {description && (
        <AlertDescription className="text-info-foreground/80">
          {description}
        </AlertDescription>
      )}
    </Alert>
  )
}
