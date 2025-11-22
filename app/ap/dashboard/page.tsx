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
          const totalValue = invoices.reduce((sum: number, inv: any) => {
            const amount = Number(inv.amount_doc_curr ?? inv.amount_local_curr ?? inv.amount ?? 0)
            return sum + (Number.isFinite(amount) ? amount : 0)
          }, 0)
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
  <div className="bg-background min-h-screen text-foreground transition-colors duration-300">
      <DashboardHeader userName={session?.username || "User"} />
      <main className="mx-auto px-4 py-8 max-w-7xl container">
        <div className="relative mb-10">
          <div className="absolute inset-0 blur-3xl rounded-2xl bg-accent-red/10" />
          <div className="relative bg-card shadow-2xl p-8 border border-accent-red/20 rounded-2xl transition-colors duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full w-1 h-12 bg-accent-red" />
              <h1 className="font-bold text-foreground text-5xl transition-colors duration-300">
                Welcome back, <span className="text-accent-red">{session?.username || "User"}</span>
              </h1>
            </div>
            <p className="ml-7 text-muted-foreground text-xl transition-colors duration-300">
              Manage your invoices, vendors, and track supplier financing offers
            </p>
          </div>
        </div>
        {error && (
          <div className="bg-red-50 mb-6 p-4 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        <div className="gap-6 grid md:grid-cols-3 mb-8">
          <Card className="shadow-xl hover:shadow-2xl border-0 hover:scale-105 transition-all duration-300 bg-accent-green">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardDescription className="font-medium text-accent-green">Total Invoices</CardDescription>
                  <CardTitle className="mt-2 font-bold text-foreground text-4xl transition-colors duration-300">{loading ? "..." : stats?.totalInvoices || 0}</CardTitle>
                </div>
                <CheckCircle2 className="w-12 h-12 text-accent-green" />
              </div>
            </CardHeader>
          </Card>
          <Card className="shadow-xl hover:shadow-2xl border-0 hover:scale-105 transition-all duration-300 bg-accent-yellow">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardDescription className="font-medium text-accent-yellow">Pending Offers</CardDescription>
                  <CardTitle className="mt-2 font-bold text-foreground text-4xl transition-colors duration-300">{loading ? "..." : stats?.pendingOffers || 0}</CardTitle>
                </div>
                <Clock className="w-12 h-12 text-accent-yellow" />
              </div>
            </CardHeader>
          </Card>
          <Card className="bg-brand-blue shadow-xl hover:shadow-2xl border-0 hover:scale-105 transition-all duration-300">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardDescription className="font-medium text-brand-blue">Total Value</CardDescription>
                  <CardTitle className="mt-2 font-bold text-foreground text-4xl transition-colors duration-300">R {loading ? "..." : (stats?.totalValue || 0).toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</CardTitle>
                </div>
                <TrendingUp className="w-12 h-12 text-brand-blue" />
              </div>
            </CardHeader>
          </Card>
        </div>
        <div className="gap-6 grid md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-darkgray/50 hover:shadow-xl backdrop-blur border-darkgray hover:border-accent-red transition-all hover:shadow-accent-red/20">
            <CardHeader>
              <div className="flex justify-center items-center mb-4 rounded-xl w-14 h-14 bg-accent-red/10">
                <Upload className="w-7 h-7 text-accent-red" />
              </div>
              <CardTitle className="text-foreground text-xl">Upload Invoices</CardTitle>
              <CardDescription className="text-muted-foreground">
                Upload approved invoices for supplier matching
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/ap/invoices/upload">
                <Button className="w-full font-semibold text-foreground bg-accent-red hover:bg-accent-red" size="lg">
                  Upload AP Data
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="bg-darkgray/50 hover:shadow-xl backdrop-blur border-darkgray hover:border-accent-red transition-all hover:shadow-accent-red/20">
            <CardHeader>
              <div className="flex justify-center items-center bg-brand-blue-soft/10 mb-4 rounded-xl w-14 h-14">
                <Users className="w-7 h-7 text-brand-blue" />
              </div>
              <CardTitle className="text-foreground text-xl">Upload Vendors</CardTitle>
              <CardDescription className="text-muted-foreground">Upload vendor master data from your ERP</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/ap/vendors/upload">
                <Button
                  className="bg-darkgray hover:bg-charcoal w-full font-semibold text-foreground"
                  variant="outline"
                  size="lg"
                >
                  Upload Vendors
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="bg-darkgray/50 hover:shadow-xl backdrop-blur border-darkgray hover:border-accent-red transition-all hover:shadow-accent-red/20">
            <CardHeader>
              <div className="flex justify-center items-center mb-4 rounded-xl w-14 h-14 bg-accent-green/10">
                <FileText className="w-7 h-7 text-accent-green" />
              </div>
              <CardTitle className="text-foreground text-xl">View Invoices</CardTitle>
              <CardDescription className="text-muted-foreground">Track uploaded invoices and offer status</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/ap/invoices">
                <Button
                  variant="outline"
                  className="bg-darkgray hover:bg-charcoal border-mediumgray w-full font-semibold text-foreground"
                  size="lg"
                >
                  View All
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="bg-darkgray/50 hover:shadow-xl backdrop-blur border-darkgray hover:border-accent-red transition-all hover:shadow-accent-red/20">
            <CardHeader>
              <div className="flex justify-center items-center bg-softgrayblue/10 mb-4 rounded-xl w-14 h-14">
                <BarChart3 className="w-7 h-7 text-softgrayblue" />
              </div>
              <CardTitle className="text-foreground text-xl">Reports</CardTitle>
              <CardDescription className="text-muted-foreground">View acceptance rates and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/ap/reports">
                <Button
                  variant="outline"
                  className="bg-darkgray hover:bg-charcoal border-mediumgray w-full font-semibold text-foreground"
                  size="lg"
                >
                  View Reports
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <Card className="bg-darkgray/50 shadow-xl backdrop-blur border-darkgray">
          <CardHeader className="border-darkgray border-b">
            <CardTitle className="text-foreground text-2xl">Recent Activity</CardTitle>
            <CardDescription className="text-muted-foreground">Your latest invoice uploads and offer updates</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="py-16 text-center">
              <div className="inline-flex justify-center items-center bg-darkgray/50 mb-6 rounded-2xl w-20 h-20">
                <FileText className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="mb-2 font-semibold text-foreground text-xl">No recent activity to display</p>
              <p className="mb-8 text-muted-foreground">Upload invoices or vendors to get started</p>
              <div className="flex justify-center gap-4">
                <Link href="/ap/invoices/upload">
                  <Button className="px-8 font-semibold text-foreground bg-accent-red hover:bg-accent-red">
                    Upload Invoices
                  </Button>
                </Link>
                <Link href="/ap/vendors/upload">
                  <Button
                    variant="outline"
                    className="bg-darkgray hover:bg-charcoal px-8 border-mediumgray font-semibold text-foreground"
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
