"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Mail, Loader2, CheckCircle2, XCircle, SkipForward } from "lucide-react"

interface SendResult {
  sent: number
  skipped: number
  failed: number
  errors: string[]
}

export function SendCredentialsButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SendResult | null>(null)
  const [resultOpen, setResultOpen] = useState(false)

  const handleSend = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/send-supplier-credentials", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Request failed")
      setResult(data as SendResult)
      setResultOpen(true)
    } catch (err: any) {
      setResult({ sent: 0, skipped: 0, failed: 1, errors: [err.message] })
      setResultOpen(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="default" size="sm" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Mail className="mr-2 w-4 h-4" />
                Send Login Credentials
              </>
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Login Credentials to Approved Suppliers</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                This will generate a temporary password and send a login credentials email to every
                <strong> approved supplier that has not yet received their credentials</strong>.
              </span>
              <span className="block text-muted-foreground text-xs">
                Suppliers who already have a password set will not be affected.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSend} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Mail className="mr-2 w-4 h-4" />
              Send Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Results dialog */}
      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Credentials Email Summary</DialogTitle>
            <DialogDescription>Results from the bulk send operation.</DialogDescription>
          </DialogHeader>

          {result && (
            <div className="space-y-4 pt-2">
              <div className="gap-3 grid grid-cols-3">
                <div className="flex flex-col items-center gap-1 bg-success-bg px-3 py-3 border border-success-border rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-success-foreground" />
                  <span className="font-bold text-2xl text-success-foreground">{result.sent}</span>
                  <span className="text-success-foreground text-xs">Sent</span>
                </div>
                <div className="flex flex-col items-center gap-1 bg-muted px-3 py-3 border rounded-lg">
                  <SkipForward className="w-5 h-5 text-muted-foreground" />
                  <span className="font-bold text-2xl">{result.skipped}</span>
                  <span className="text-muted-foreground text-xs">Skipped</span>
                </div>
                <div className="flex flex-col items-center gap-1 bg-destructive/10 px-3 py-3 border border-destructive/20 rounded-lg">
                  <XCircle className="w-5 h-5 text-destructive" />
                  <span className="font-bold text-2xl text-destructive">{result.failed}</span>
                  <span className="text-destructive text-xs">Failed</span>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="space-y-1">
                  <p className="font-medium text-sm">Issues</p>
                  <ul className="space-y-1 bg-muted/50 p-3 rounded-lg max-h-40 overflow-y-auto">
                    {result.errors.map((e, i) => (
                      <li key={i} className="flex items-start gap-2 text-muted-foreground text-xs">
                        <Badge variant="outline" className="mt-0.5 shrink-0 text-[10px]">{i + 1}</Badge>
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.sent === 0 && result.failed === 0 && result.skipped === 0 && (
                <p className="text-muted-foreground text-sm text-center py-2">
                  No approved suppliers are awaiting credentials.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
