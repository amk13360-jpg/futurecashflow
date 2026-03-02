import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import Link from "next/link";
import { getSupplierProfile } from "@/lib/actions/suppliers";
import { getSupplierCessionStatus, getCessionAddendums } from "@/lib/actions/standing-cession";
import { CheckCircle, FileText, Clock, ArrowLeft, Download, Upload, Shield, AlertTriangle } from "lucide-react";

export default async function SupplierCessionAgreementPage() {
 const profile = await getSupplierProfile();
 const cessionStatus = await getSupplierCessionStatus();
 const supplierId = profile?.supplier_id || "";
 const templateUrl = `/api/cession-agreement/template?supplierId=${supplierId}`;

 // Get addendums if standing cession exists
 const addendums = cessionStatus.standingCession 
 ? await getCessionAddendums(cessionStatus.standingCession.cession_id)
 : [];

 return (
 <div className="bg-muted min-h-screen">
 <main className="mx-auto px-4 py-8 container">
 <Breadcrumbs
 items={[
 { label: "Dashboard", href: "/supplier/dashboard" },
 { label: "Cession Agreement" },
 ]}
 />
 <Link
 href="/supplier/dashboard"
 className="inline-flex items-center mb-6 text-muted-foreground hover:text-foreground text-sm"
 >
 <ArrowLeft className="mr-2 w-4 h-4" />
 Back to dashboard
 </Link>

 <div className="mx-auto max-w-4xl">
 <div className="mb-8">
 <h1 className="mb-2 font-bold text-3xl">Cession Agreements</h1>
 <p className="text-muted-foreground">
 Manage your standing cession agreement and view invoice addendums
 </p>
 </div>

 {/* Standing Cession Status */}
 <Card className="mb-8">
 <CardHeader>
 <div className="flex justify-between items-center">
 <div className="flex items-center gap-3">
 <div className="bg-primary/10 p-2 rounded-lg">
 <Shield className="w-6 h-6 text-primary" />
 </div>
 <div>
 <CardTitle>Standing Cession Agreement</CardTitle>
 <CardDescription>
 A reusable agreement that covers all future invoice acceptances
 </CardDescription>
 </div>
 </div>
 {cessionStatus.hasStandingCession && (
 <Badge 
 variant={cessionStatus.standingCession?.status === 'approved' ? 'default' : 'secondary'}
 className="capitalize"
 >
 {cessionStatus.standingCession?.status === 'approved' ? (
 <><CheckCircle className="mr-1 w-3 h-3" /> Active</>
 ) : cessionStatus.standingCession?.status === 'signed' ? (
 <><Clock className="mr-1 w-3 h-3" /> Pending Approval</>
 ) : (
 <><Clock className="mr-1 w-3 h-3" /> {cessionStatus.standingCession?.status}</>
 )}
 </Badge>
 )}
 </div>
 </CardHeader>
 <CardContent>
 {cessionStatus.hasStandingCession ? (
 <div className="space-y-4">
 <div className="gap-4 grid grid-cols-2 md:grid-cols-4 text-sm">
 <div>
 <p className="text-muted-foreground">Signed Date</p>
 <p className="font-medium">
 {cessionStatus.standingCession?.signed_date 
 ? new Date(cessionStatus.standingCession.signed_date).toLocaleDateString()
 : "Not yet signed"
 }
 </p>
 </div>
 <div>
 <p className="text-muted-foreground">Valid Until</p>
 <p className="font-medium">
 {cessionStatus.standingCession?.standing_valid_until 
 ? new Date(cessionStatus.standingCession.standing_valid_until).toLocaleDateString()
 : "Indefinite"
 }
 </p>
 </div>
 <div>
 <p className="text-muted-foreground">Total Addendums</p>
 <p className="font-medium">{cessionStatus.totalAddendums}</p>
 </div>
 <div>
 <p className="text-muted-foreground">Pending Approval</p>
 <p className="font-medium">{cessionStatus.pendingAddendums}</p>
 </div>
 </div>

 {cessionStatus.standingCession?.status === 'approved' && (
 <Alert className="bg-success-bg border-success-border">
 <CheckCircle className="w-4 h-4 text-success" />
 <AlertDescription>
 Your standing cession is active. When you accept offers, addendums will be 
 automatically generated and attached to this agreement.
 </AlertDescription>
 </Alert>
 )}

 {cessionStatus.standingCession?.document_url && (
 <Button variant="outline" asChild>
 <a href={cessionStatus.standingCession.document_url} target="_blank">
 <Download className="mr-2 w-4 h-4" />
 View Signed Document
 </a>
 </Button>
 )}
 </div>
 ) : (
 <div className="space-y-4">
 <Alert>
 <AlertTriangle className="w-4 h-4" />
 <AlertDescription>
 You need to sign a standing cession agreement before you can accept offers.
 This is a one-time agreement that covers all future invoice acceptances.
 </AlertDescription>
 </Alert>

 <div className="flex sm:flex-row flex-col gap-3">
 <Button variant="outline" asChild>
 <a href={templateUrl} download>
 <Download className="mr-2 w-4 h-4" />
 Download Template
 </a>
 </Button>
 <Button asChild>
 <Link href="/supplier/cession-agreement/upload">
 <Upload className="mr-2 w-4 h-4" />
 Upload Signed Agreement
 </Link>
 </Button>
 </div>
 </div>
 )}
 </CardContent>
 </Card>

 {/* Addendums Section */}
 {cessionStatus.hasStandingCession && (
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <FileText className="w-5 h-5" />
 Invoice Addendums
 </CardTitle>
 <CardDescription>
 Each time you accept offers, an addendum is created linking the invoices to your standing cession
 </CardDescription>
 </CardHeader>
 <CardContent>
 {addendums.length === 0 ? (
 <div className="py-8 text-muted-foreground text-center">
 <FileText className="opacity-50 mx-auto mb-3 w-12 h-12" />
 <p>No addendums yet</p>
 <p className="text-sm">Addendums will appear here when you accept offers</p>
 </div>
 ) : (
 <div className="space-y-3">
 {addendums.map((addendum) => (
 <div 
 key={addendum.cession_id} 
 className="flex justify-between items-center p-4 border rounded-lg"
 >
 <div className="flex items-center gap-4">
 <div className="bg-muted p-2 rounded">
 <FileText className="w-5 h-5" />
 </div>
 <div>
 <p className="font-medium">
 Addendum #{addendum.cession_id}
 </p>
 <p className="text-muted-foreground text-sm">
 {addendum.trigger_reason === 'offer_acceptance' 
 ? 'Offer Acceptance' 
 : addendum.trigger_reason
 } • {new Date(addendum.created_at).toLocaleDateString()}
 </p>
 {addendum.linked_invoice_ids && (
 <p className="mt-1 text-muted-foreground text-xs">
 {JSON.parse(addendum.linked_invoice_ids).length} invoice(s) included
 </p>
 )}
 </div>
 </div>
 <div className="flex items-center gap-3">
 <Badge variant={addendum.status === 'approved' ? 'default' : 'secondary'} className="capitalize">
 {addendum.status}
 </Badge>
 {addendum.document_url && (
 <Button variant="ghost" size="sm" asChild>
 <a href={addendum.document_url} target="_blank">
 <Download className="w-4 h-4" />
 </a>
 </Button>
 )}
 </div>
 </div>
 ))}
 </div>
 )}
 </CardContent>
 </Card>
 )}
 </div>
 </main>
 </div>
 );
}
