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
      <XCircle className="w-4 h-4" />
      <AlertTitle className="font-semibold">{title}</AlertTitle>
      <AlertDescription>
        <ul className="space-y-2 mt-3 list-disc list-inside">
          {errors.map((error, index) => (
            <li key={index} className="text-sm">
              {onFieldClick ? (
                <button
                  type="button"
                  onClick={() => onFieldClick(error.field)}
                  className="px-1 rounded focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-1 text-left hover:underline"
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
    <Alert variant="default" className={cn("bg-success-bg mb-6 border-success", className)}>
      <CheckCircle2 className="w-4 h-4 text-success" />
      <AlertTitle className="font-semibold text-success">{message}</AlertTitle>
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
          className="top-2 right-2 absolute hover:bg-success/10 p-0 w-8 h-8"
        >
          <XCircle className="w-4 h-4" />
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
    <Alert variant="default" className={cn("bg-info-bg mb-6 border-info", className)}>
      <Info className="w-4 h-4 text-info" />
      <AlertTitle className="font-semibold text-info">{message}</AlertTitle>
      {description && (
        <AlertDescription className="text-info-foreground/80">
          {description}
        </AlertDescription>
      )}
    </Alert>
  )
}
