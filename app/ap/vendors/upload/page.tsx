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
import { parseVendorDataCSV, uploadVendorData } from "@/lib/actions/invoices"
import { FileText, CheckCircle, AlertCircle, ArrowLeft, Users } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function VendorUploadPage() {
  const router = useRouter()
  const [csvText, setCsvText] = useState("")
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<any[]>([])
  const [results, setResults] = useState<{ uploaded: string[]; errors: string[]; newSuppliers?: any[] } | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result as string
        setCsvText(text)
        toast.success("File loaded successfully")
      }
      reader.readAsText(file)
    }
  }

  const handlePreview = async () => {
    try {
      const rows = await parseVendorDataCSV(csvText)
      setPreview(rows.slice(0, 10))
      toast.success(`Parsed ${rows.length} vendor records`)
    } catch (error: any) {
      toast.error(error.message || "Failed to parse CSV. Please check the format.")
    }
  }

  const handleUpload = async () => {
    setLoading(true)
    try {
      const rows = await parseVendorDataCSV(csvText)
      const result = await uploadVendorData(rows)
      setResults(result)
      if (result.newSuppliers && result.newSuppliers.length > 0) {
        toast.success(
          `Uploaded ${result.uploaded.length} vendors. ${result.newSuppliers.length} invitation emails sent.`,
        )
      } else {
        toast.success(`Uploaded ${result.uploaded.length} vendors`)
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to upload vendors")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/ap/dashboard"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to dashboard
          </Link>
          <h2 className="text-3xl font-bold">Upload Vendor Data</h2>
          <p className="text-muted-foreground">Upload supplier/vendor master data from your ERP system</p>
        </div>

        {!results ? (
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Vendor Data CSV Upload</CardTitle>
                <CardDescription>Upload your vendor master data export</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Required CSV columns:</strong>
                    <br />
                    Company Code, Vendor Number, Vendor Name, Address, Contact Person, Contact Email, Contact Phone,
                    Bank Country, Bank Name, Bank Key (Branch Code), Bank Account Number, IBAN, SWIFT/BIC, Default
                    Payment Method, Default Payment Terms, VAT Registration No, Reconciliation G/L Account
                  </AlertDescription>
                </Alert>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Note:</strong> New suppliers will automatically receive invitation emails to complete their
                    onboarding. Existing suppliers will be updated with the new information.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="file">Upload CSV File</Label>
                  <input
                    id="file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    placeholder="Select CSV file"
                    title="Upload CSV file"
                    className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="csv">Or Paste CSV Data</Label>
                  <Textarea
                    id="csv"
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    placeholder="Company Code,Vendor Number,Vendor Name,Address,Contact Person,Contact Email,Contact Phone,Bank Country,Bank Name,Bank Key (Branch Code),Bank Account Number,IBAN,SWIFT/BIC,Default Payment Method,Default Payment Terms,VAT Registration No,Reconciliation G/L Account
1000,200008,Marumo Construction,707 Main Rd Rustenburg,Palesa Mahlangu,info@marumo-construction.co.za,+27 780 450 9862,ZA,First National Bank,250655,8166292195,,FIRNZAJJ,T (EFT),0002 (45 days),4673016401,200000"
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
                  <Button onClick={handleUpload} disabled={!csvText || loading} className="flex-1">
                    {loading ? "Uploading..." : "Upload Vendor Data"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>Review vendor data before uploading (first 10 rows)</CardDescription>
              </CardHeader>
              <CardContent>
                {preview.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No data to preview</p>
                    <p className="text-sm mt-1">Click "Preview" to parse your CSV</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {preview.map((row, idx) => (
                      <div key={idx} className="p-3 border rounded-lg text-sm">
                        <div className="font-medium">{row["Vendor Name"]}</div>
                        <div className="text-muted-foreground text-xs">Vendor #: {row["Vendor Number"]}</div>
                        <div className="text-xs mt-1">{row["Contact Email"]}</div>
                        <div className="text-xs text-muted-foreground">
                          {row["Bank Name"]} - {row["Bank Account Number"]}
                        </div>
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
              <CardDescription>Summary of vendor data upload</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {results.uploaded.length > 0 && (
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription>
                    <strong>Successfully uploaded {results.uploaded.length} vendors</strong>
                    {results.newSuppliers && results.newSuppliers.length > 0 && (
                      <div className="mt-2 text-sm">
                        <strong>{results.newSuppliers.length} new suppliers</strong> received invitation emails
                      </div>
                    )}
                    <div className="mt-2 text-sm">
                      {results.uploaded.slice(0, 5).map((vendor) => (
                        <div key={vendor}>• Vendor {vendor}</div>
                      ))}
                      {results.uploaded.length > 5 && <div>... and {results.uploaded.length - 5} more</div>}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {results.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{results.errors.length} errors occurred</strong>
                    <div className="mt-2 text-sm">
                      {results.errors.slice(0, 5).map((err, idx) => (
                        <div key={idx}>• {err}</div>
                      ))}
                      {results.errors.length > 5 && <div>... and {results.errors.length - 5} more</div>}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button onClick={() => router.push("/ap/dashboard")} className="flex-1">
                  Back to Dashboard
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
