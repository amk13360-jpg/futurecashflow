"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileText, BarChart3, Users } from "lucide-react"
import Link from "next/link"

export default function APDashboardPage() {
  return (
    <div className="bg-background min-h-screen text-foreground transition-colors duration-300">
      <main className="mx-auto px-4 py-8 max-w-7xl container">
        {/* Welcome Section */}
        <div className="relative mb-10">
          <div className="relative bg-card shadow-xl p-8 border rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary rounded-full w-1 h-12" />
              <h1 className="font-bold text-foreground text-4xl md:text-5xl">Accounts Payable Dashboard</h1>
            </div>
            <p className="ml-7 text-muted-foreground text-lg md:text-xl">
              Manage your vendor and invoice data for early payment processing
            </p>
          </div>
        </div>

        {/* Action Cards */}
        <div className="gap-6 grid md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="bg-card hover:shadow-xl backdrop-blur border hover:border-primary/50 transition-all">
            <CardHeader>
              <div className="flex justify-center items-center bg-primary/10 mb-4 rounded-xl w-14 h-14">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <CardTitle className="text-foreground text-xl">Upload Vendors</CardTitle>
              <CardDescription className="text-muted-foreground">Upload vendor master data from your ERP</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/ap/vendors/upload">
                <Button variant="outline" className="w-full font-semibold" size="lg">
                  Upload Vendors
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="bg-card hover:shadow-xl backdrop-blur border hover:border-primary/50 transition-all">
            <CardHeader>
              <div className="flex justify-center items-center bg-primary/10 mb-4 rounded-xl w-14 h-14">
                <Upload className="w-7 h-7 text-primary" />
              </div>
              <CardTitle className="text-foreground text-xl">Upload Invoices</CardTitle>
              <CardDescription className="text-muted-foreground">
                Upload approved invoices for processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/ap/invoices/upload">
                <Button variant="outline" className="w-full font-semibold" size="lg">
                  Upload AP Data
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="bg-card hover:shadow-xl backdrop-blur border hover:border-primary/50 transition-all">
            <CardHeader>
              <div className="flex justify-center items-center mb-4 rounded-xl w-14 h-14 bg-accent-green/10">
                <FileText className="w-7 h-7 text-accent-green" />
              </div>
              <CardTitle className="text-foreground text-xl">View Invoices</CardTitle>
              <CardDescription className="text-muted-foreground">
                View uploaded invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/ap/invoices">
                <Button variant="outline" className="w-full font-semibold" size="lg">
                  View All
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="bg-card hover:shadow-xl backdrop-blur border hover:border-primary/50 transition-all">
            <CardHeader>
              <div className="flex justify-center items-center bg-muted mb-4 rounded-xl w-14 h-14">
                <BarChart3 className="w-7 h-7 text-muted-foreground" />
              </div>
              <CardTitle className="text-foreground text-xl">View Vendors</CardTitle>
              <CardDescription className="text-muted-foreground">View uploaded vendors</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/ap/reports">
                <Button variant="outline" className="w-full font-semibold" size="lg">
                  View Vendors
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
