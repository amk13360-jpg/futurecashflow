"use client"
import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileText, BarChart3, Users, TrendingUp, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function APDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
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
          setStats({ totalInvoices, totalValue })
          setLoading(false)
        }
      } catch (err: any) {
        if (mounted) {
          toast.error(err.message || "Failed to load dashboard stats")
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
      <DashboardHeader userName={session?.fullName || session?.username || "User"} />
      <main className="mx-auto px-4 py-8 max-w-7xl container">
        {/* Welcome Section */}
        <div className="relative mb-10">
          <div className="relative bg-card shadow-xl p-8 border rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary rounded-full w-1 h-12" />
              <h1 className="font-bold text-foreground text-4xl md:text-5xl">Accounts Payable Dashboard</h1>
            </div>
            <p className="ml-7 text-muted-foreground text-lg md:text-xl">
              Please upload your vendor and accounts payable data
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
              <div className="flex justify-center items-center bg-accent-green/10 mb-4 rounded-xl w-14 h-14">
                <FileText className="w-7 h-7 text-accent-green" />
              </div>
              <CardTitle className="text-foreground text-xl">View Invoices</CardTitle>
              <CardDescription className="text-muted-foreground">
                Track uploaded invoices and offer status
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
              <CardTitle className="text-foreground text-xl">Reports</CardTitle>
              <CardDescription className="text-muted-foreground">View uploaded vendors and invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/ap/reports">
                <Button variant="outline" className="w-full font-semibold" size="lg">
                  View Reports
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-card shadow-xl backdrop-blur border">
          <CardHeader className="border-b">
            <CardTitle className="text-foreground text-2xl">Recent Activity</CardTitle>
            <CardDescription className="text-muted-foreground">Your latest invoice uploads and offer updates</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="py-16 text-center">
              <div className="inline-flex justify-center items-center bg-muted mb-6 rounded-2xl w-20 h-20">
                <FileText className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="mb-2 font-semibold text-foreground text-xl">No recent activity to display</p>
              <p className="mb-8 text-muted-foreground">Upload invoices or vendors to get started</p>
              <div className="flex justify-center gap-4">
                <Link href="/ap/invoices/upload">
                  <Button variant="outline" className="px-8 font-semibold">
                    Upload Invoices
                  </Button>
                </Link>
                <Link href="/ap/vendors/upload">
                  <Button variant="outline" className="px-8 font-semibold">
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
