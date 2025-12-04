import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SupplierHeader } from "@/components/supplier/supplier-header";
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
    <div className="min-h-screen bg-muted/30">
      <SupplierHeader supplierName={profile?.name} />
      
      <main className="container mx-auto px-4 py-8">
        <Link
          href="/supplier/dashboard"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to dashboard
        </Link>

        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Cession Agreements</h1>
            <p className="text-muted-foreground">
              Manage your standing cession agreement and view invoice addendums
            </p>
          </div>

          {/* Standing Cession Status */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Shield className="h-6 w-6 text-primary" />
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
                      <><CheckCircle className="h-3 w-3 mr-1" /> Active</>
                    ) : cessionStatus.standingCession?.status === 'signed' ? (
                      <><Clock className="h-3 w-3 mr-1" /> Pending Approval</>
                    ) : (
                      <><Clock className="h-3 w-3 mr-1" /> {cessionStatus.standingCession?.status}</>
                    )}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {cessionStatus.hasStandingCession ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                    <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription>
                        Your standing cession is active. When you accept offers, addendums will be 
                        automatically generated and attached to this agreement.
                      </AlertDescription>
                    </Alert>
                  )}

                  {cessionStatus.standingCession?.document_url && (
                    <Button variant="outline" asChild>
                      <a href={cessionStatus.standingCession.document_url} target="_blank">
                        <Download className="h-4 w-4 mr-2" />
                        View Signed Document
                      </a>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      You need to sign a standing cession agreement before you can accept offers.
                      This is a one-time agreement that covers all future invoice acceptances.
                    </AlertDescription>
                  </Alert>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button variant="outline" asChild>
                      <a href={templateUrl} download>
                        <Download className="h-4 w-4 mr-2" />
                        Download Template
                      </a>
                    </Button>
                    <Button asChild>
                      <Link href="/supplier/cession-agreement/upload">
                        <Upload className="h-4 w-4 mr-2" />
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
                  <FileText className="h-5 w-5" />
                  Invoice Addendums
                </CardTitle>
                <CardDescription>
                  Each time you accept offers, an addendum is created linking the invoices to your standing cession
                </CardDescription>
              </CardHeader>
              <CardContent>
                {addendums.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No addendums yet</p>
                    <p className="text-sm">Addendums will appear here when you accept offers</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addendums.map((addendum) => (
                      <div 
                        key={addendum.cession_id} 
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-muted rounded">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">
                              Addendum #{addendum.cession_id}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {addendum.trigger_reason === 'offer_acceptance' 
                                ? 'Offer Acceptance' 
                                : addendum.trigger_reason
                              } • {new Date(addendum.created_at).toLocaleDateString()}
                            </p>
                            {addendum.linked_invoice_ids && (
                              <p className="text-xs text-muted-foreground mt-1">
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
                                <Download className="h-4 w-4" />
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
