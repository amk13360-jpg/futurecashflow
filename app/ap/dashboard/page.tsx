"use client"
import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileText, BarChart3, Users, TrendingUp, Clock, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function APDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<any>(null)
  useEffect(() => {
    fetch("/api/session")
      .then(res => res.json())
      .then(data => setSession(data))
      .catch(() => setSession({ username: "User" }))
    let mounted = true
    const fetchStats = async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/invoices", { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to fetch invoices")
        const invoices = await res.json()
        if (mounted) {
          const totalInvoices = invoices.length
          const totalValue = invoices.reduce((sum: number, inv: any) => sum + Number(inv.amount_doc_curr || 0), 0)
          const pendingOffers = invoices.filter((inv: any) => inv.status === "offered").length
          setStats({ totalInvoices, totalValue, pendingOffers })
          setLoading(false)
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || "Failed to load dashboard stats")
          setLoading(false)
        }
      }
    }
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return (
  <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <DashboardHeader userName={session?.username || "User"} />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-10 relative">
          <div className="absolute inset-0 bg-accent-red/10 rounded-2xl blur-3xl" />
          <div className="relative bg-card rounded-2xl p-8 border border-accent-red/20 shadow-2xl transition-colors duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-1 bg-accent-red rounded-full" />
              <h1 className="text-5xl font-bold text-foreground transition-colors duration-300">
                Welcome back, <span className="text-accent-red">{session?.username || "User"}</span>
              </h1>
            </div>
            <p className="text-xl text-muted-foreground ml-7 transition-colors duration-300">
              Manage your invoices, vendors, and track supplier financing offers
            </p>
          </div>
        </div>
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-accent-green border-0 shadow-xl hover:shadow-2xl transition-all hover:scale-105 duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardDescription className="text-accent-green font-medium">Total Invoices</CardDescription>
                  <CardTitle className="text-4xl font-bold text-foreground mt-2 transition-colors duration-300">{loading ? "..." : stats?.totalInvoices || 0}</CardTitle>
                </div>
                <CheckCircle2 className="h-12 w-12 text-accent-green" />
              </div>
            </CardHeader>
          </Card>
          <Card className="bg-accent-yellow border-0 shadow-xl hover:shadow-2xl transition-all hover:scale-105 duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardDescription className="text-accent-yellow font-medium">Pending Offers</CardDescription>
                  <CardTitle className="text-4xl font-bold text-foreground mt-2 transition-colors duration-300">{loading ? "..." : stats?.pendingOffers || 0}</CardTitle>
                </div>
                <Clock className="h-12 w-12 text-accent-yellow" />
              </div>
            </CardHeader>
          </Card>
          <Card className="bg-brand-blue border-0 shadow-xl hover:shadow-2xl transition-all hover:scale-105 duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardDescription className="text-brand-blue font-medium">Total Value</CardDescription>
                  <CardTitle className="text-4xl font-bold text-foreground mt-2 transition-colors duration-300">R {loading ? "..." : (stats?.totalValue || 0).toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</CardTitle>
                </div>
                <TrendingUp className="h-12 w-12 text-brand-blue" />
              </div>
            </CardHeader>
          </Card>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-darkgray/50 backdrop-blur border-darkgray hover:border-accent-red transition-all hover:shadow-xl hover:shadow-accent-red/20">
            <CardHeader>
              <div className="h-14 w-14 rounded-xl bg-accent-red/10 flex items-center justify-center mb-4">
                <Upload className="h-7 w-7 text-accent-red" />
              </div>
              <CardTitle className="text-xl text-foreground">Upload Invoices</CardTitle>
              <CardDescription className="text-muted-foreground">
                Upload approved invoices for supplier matching
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/ap/invoices/upload">
                <Button className="w-full bg-accent-red hover:bg-accent-red text-foreground font-semibold" size="lg">
                  Upload AP Data
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="bg-darkgray/50 backdrop-blur border-darkgray hover:border-accent-red transition-all hover:shadow-xl hover:shadow-accent-red/20">
            <CardHeader>
              <div className="h-14 w-14 rounded-xl bg-brand-blue-soft/10 flex items-center justify-center mb-4">
                <Users className="h-7 w-7 text-brand-blue" />
              </div>
              <CardTitle className="text-xl text-foreground">Upload Vendors</CardTitle>
              <CardDescription className="text-muted-foreground">Upload vendor master data from your ERP</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/ap/vendors/upload">
                <Button
                  className="w-full bg-darkgray hover:bg-charcoal text-foreground font-semibold"
                  variant="outline"
                  size="lg"
                >
                  Upload Vendors
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="bg-darkgray/50 backdrop-blur border-darkgray hover:border-accent-red transition-all hover:shadow-xl hover:shadow-accent-red/20">
            <CardHeader>
              <div className="h-14 w-14 rounded-xl bg-accent-green/10 flex items-center justify-center mb-4">
                <FileText className="h-7 w-7 text-accent-green" />
              </div>
              <CardTitle className="text-xl text-foreground">View Invoices</CardTitle>
              <CardDescription className="text-muted-foreground">Track uploaded invoices and offer status</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/ap/invoices">
                <Button
                  variant="outline"
                  className="w-full bg-darkgray hover:bg-charcoal text-foreground font-semibold border-mediumgray"
                  size="lg"
                >
                  View All
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="bg-darkgray/50 backdrop-blur border-darkgray hover:border-accent-red transition-all hover:shadow-xl hover:shadow-accent-red/20">
            <CardHeader>
              <div className="h-14 w-14 rounded-xl bg-softgrayblue/10 flex items-center justify-center mb-4">
                <BarChart3 className="h-7 w-7 text-softgrayblue" />
              </div>
              <CardTitle className="text-xl text-foreground">Reports</CardTitle>
              <CardDescription className="text-muted-foreground">View acceptance rates and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/ap/reports">
                <Button
                  variant="outline"
                  className="w-full bg-darkgray hover:bg-charcoal text-foreground font-semibold border-mediumgray"
                  size="lg"
                >
                  View Reports
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="bg-darkgray/50 backdrop-blur border-darkgray hover:border-accent-red transition-all hover:shadow-xl hover:shadow-accent-red/20">
            <CardHeader>
              <div className="h-14 w-14 rounded-xl bg-blue-600/10 flex items-center justify-center mb-4">
                <Users className="h-7 w-7 text-blue-600" />
              </div>
              <CardTitle className="text-xl text-foreground">View Suppliers</CardTitle>
              <CardDescription className="text-muted-foreground">View supplier/vendor list and details</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/ap/suppliers">
                <Button
                  variant="outline"
                  className="w-full bg-darkgray hover:bg-charcoal text-foreground font-semibold border-mediumgray"
                  size="lg"
                >
                  View Suppliers
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <Card className="bg-darkgray/50 backdrop-blur border-darkgray shadow-xl">
          <CardHeader className="border-b border-darkgray">
            <CardTitle className="text-2xl text-foreground">Recent Activity</CardTitle>
            <CardDescription className="text-muted-foreground">Your latest invoice uploads and offer updates</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-darkgray/50 mb-6">
                <FileText className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-xl font-semibold text-foreground mb-2">No recent activity to display</p>
              <p className="text-muted-foreground mb-8">Upload invoices or vendors to get started</p>
              <div className="flex gap-4 justify-center">
                <Link href="/ap/invoices/upload">
                  <Button className="bg-accent-red hover:bg-accent-red text-foreground font-semibold px-8">
                    Upload Invoices
                  </Button>
                </Link>
                <Link href="/ap/vendors/upload">
                  <Button
                    variant="outline"
                    className="bg-darkgray hover:bg-charcoal text-foreground border-mediumgray font-semibold px-8"
                  >
                    Upload Vendors
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
