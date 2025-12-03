import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getSupplierProfile } from "@/lib/actions/suppliers";

export default async function SupplierCessionAgreementPage() {
  const profile = await getSupplierProfile();
  const supplierId = profile?.supplier_id || "";
  const templateUrl = `/api/cession-agreement/template?supplierId=${supplierId}`;

  return (
    <div className="flex flex-col justify-center items-center bg-muted/30 min-h-screen">
      <div className="bg-background shadow p-8 border rounded-lg w-full max-w-lg text-foreground">
        <h1 className="mb-4 font-bold text-2xl">Cession Agreement Required</h1>
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
