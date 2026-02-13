"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { FileUploadZone } from "@/components/ui/file-upload-zone"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { parseAPDataCSV, uploadAPData } from "@/lib/actions/invoices"
import { Upload, FileText, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function InvoiceUploadPage() {
  const router = useRouter()
  const [csvText, setCsvText] = useState("")
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<any[]>([])
  const [results, setResults] = useState<{ uploaded: string[]; errors: string[] } | null>(null)

  const handleFileUpload = (files: File[]) => {
    const file = files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setCsvText(text)
      toast.success("File loaded successfully")
    }
    reader.readAsText(file)
  }

  const handlePreview = async () => {
    try {
      const rows = await parseAPDataCSV(csvText)
      setPreview(rows.slice(0, 10)) // Show first 10 rows
      toast.success(`Parsed ${rows.length} AP data rows`)
    } catch (error: any) {
      toast.error(error.message || "Failed to parse CSV. Please check the format.")
    }
  }

  const handleUpload = async () => {
    setLoading(true)
    try {
      const rows = await parseAPDataCSV(csvText)
      const result = await uploadAPData(rows)
      setResults(result)
      if (result.uploaded.length > 0) {
        toast.success(`Uploaded ${result.uploaded.length} invoices successfully`)
      }
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} errors occurred during upload`)
      }

      if (result.uploaded.length > 0) {
        router.refresh() // Force refresh the router cache
        setTimeout(() => {
          router.push("/ap/invoices")
        }, 1500)
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to upload invoices")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-muted min-h-screen">
      <DashboardHeader />

      <main className="mx-auto px-4 py-8 container">
        <div className="mb-6">
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/ap/dashboard" },
              { label: "Invoices", href: "/ap/invoices" },
              { label: "Upload" },
            ]}
          />
          <Link
            href="/ap/dashboard"
            className="inline-flex items-center mb-4 text-muted-foreground hover:text-foreground text-sm"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to dashboard
          </Link>
          <h2 className="font-bold text-3xl">Upload AP Data</h2>
          <p className="text-muted-foreground">Please upload your approved accounts payable data from your ERP system here</p>
        </div>

        {!results ? (
          <div className="gap-6 grid lg:grid-cols-2">
            <Card>
              <CardHeader>
                <Upload className="mb-2 w-8 h-8 text-primary" />
                <CardTitle>AP Data CSV Upload</CardTitle>
                <CardDescription>Upload your accounts payable data export</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <FileText className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Required CSV columns:</strong>
                    <br />
                    Company Code, Vendor Number, Vendor Name, Document Number, Document Type, Document Date, Posting
                    Date, Baseline Date, Net Due Date, Days Overdue, Amount (Doc Curr), Currency, Amount (Local Curr),
                    Payment Terms, Payment Method, Assignment (PO #), Reference (Invoice #), Open Item, Text
                  </AlertDescription>
                </Alert>

                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Note:</strong> Make sure vendors have been uploaded first. Invoices will be matched to existing suppliers by Vendor Number.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="file">Upload CSV File</Label>
                  <FileUploadZone
                    id="file"
                    accept=".csv"
                    maxFiles={1}
                    maxSize={10 * 1024 * 1024}
                    onFilesChange={handleFileUpload}
                    onError={(message) => toast.error("✗ " + message)}
                    description="Upload an AP CSV export (max 10MB)."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="csv">Or Paste CSV Data</Label>
                  <Textarea
                    id="csv"
                    value={csvText}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCsvText(e.target.value)}
                    placeholder="Company Code,Vendor Number,Vendor Name,Document Number,Document Type,Document Date,Posting Date,Baseline Date,Net Due Date,Days Overdue,Amount (Doc Curr),Currency,Amount (Local Curr),Payment Terms,Payment Method,Assignment (PO #),Reference (Invoice #),Open Item,Text
2000,200016,Shosholoza Logistics,19000300,KR,2025-08-25,2025-08-25,2025-08-25,2025-10-24,-64,9303.57,ZAR,9303.57,0003 (60 days),T (EFT),PO2100,INV-3100,Yes,IT support"
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handlePreview}
                    variant="outline"
                    disabled={!csvText || loading}
                    className="flex-1 bg-transparent"
                  >
                    Preview
                  </Button>
                  <Button onClick={handleUpload} variant="outline" disabled={!csvText || loading} className="flex-1">
                    {loading ? "Uploading..." : "Upload AP Data"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>Review AP data before uploading (first 10 rows)</CardDescription>
              </CardHeader>
              <CardContent>
                {preview.length === 0 ? (
                  <div className="py-8 text-muted-foreground text-center">
                    <FileText className="opacity-50 mx-auto mb-3 w-12 h-12" />
                    <p>No data to preview</p>
                    <p className="mt-1 text-sm">Click &quot;Preview&quot; to parse your CSV</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {preview.map((row: any, idx: number) => (
                      <div key={idx} className="p-3 border rounded-lg text-sm">
                        <div className="font-medium">
                          {row["Document Number"]} - {row["Vendor Name"]}
                        </div>
                        <div className="text-muted-foreground text-xs">Vendor: {row["Vendor Number"]}</div>
                        <div className="flex justify-between mt-1">
                          <span>
                            {row["Currency"]} {Number.parseFloat(row["Amount (Doc Curr)"]).toLocaleString()}
                          </span>
                          <span className="text-xs">Due: {row["Net Due Date"]}</span>
                        </div>
                        <div className="mt-1 text-muted-foreground text-xs">{row["Text"]}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Upload Results</CardTitle>
              <CardDescription>Summary of AP data upload</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2">
                <Button onClick={() => router.push("/ap/invoices")} className="flex-1">
                  View Invoices
                </Button>
                <Button
                  onClick={() => {
                    setResults(null)
                    setCsvText("")
                    setPreview([])
                  }}
                  variant="outline"
                  className="flex-1 bg-transparent"
                >
                  Upload More
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
