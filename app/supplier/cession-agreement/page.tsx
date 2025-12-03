import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getSupplierProfile } from "@/lib/actions/suppliers";

export default async function SupplierCessionAgreementPage() {
  const profile = await getSupplierProfile();
  const supplierId = profile?.supplier_id || "";
  const templateUrl = `/api/cession-agreement/template?supplierId=${supplierId}`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30">
      <div className="max-w-lg w-full bg-background text-foreground rounded-lg shadow p-8 border">
        <h1 className="text-2xl font-bold mb-4">Cession Agreement Required</h1>
        <p className="mb-6 text-muted-foreground">
          To access offers and payments, you must sign or upload your cession agreement. Please download the template, sign it, and upload the completed document.
        </p>
        <div className="flex flex-col gap-4">
          <Button asChild variant="outline">
            <a href={templateUrl} download>Download Template</a>
          </Button>
          <Button asChild>
            <Link href="/supplier/cession-agreement/upload">Upload Signed Agreement</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
