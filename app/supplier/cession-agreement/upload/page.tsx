"use client"
import React from "react";
import { Button } from "@/components/ui/button";
import { FileUploadZone } from "@/components/ui/file-upload-zone";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function SupplierCessionAgreementUploadPage() {
 const [uploading, setUploading] = React.useState(false);
 const [error, setError] = React.useState<string | null>(null);
 const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
 const router = useRouter();

 async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
 e.preventDefault();
 setError(null);
 setUploading(true);
 if (selectedFiles.length === 0) {
 setError("Please select a PDF file to upload.");
 setUploading(false);
 return;
 }
 const file = selectedFiles[0];
 const formData = new FormData();
 formData.append("file", file);
 try {
 const res = await fetch("/api/cession-agreement/upload", {
 method: "POST",
 body: formData,
 });
 const data = await res.json();
 if (data.success) {
 toast.success("✓ Cession agreement uploaded successfully. Dashboard updated.")
 // Navigate to dashboard which will fetch fresh server state
 router.push("/supplier/dashboard")
 } else {
 const msg = data.error || data.details || "Upload failed"
 toast.error("✗ " + msg)
 setError(msg);
 }
 } catch (err: any) {
 const msg = err?.message || "Upload failed"
 toast.error("✗ " + msg)
 setError(msg);
 }
 setUploading(false);
 }

 return (
 <div className="flex flex-col justify-center items-center bg-muted min-h-screen">
 <div className="bg-background shadow p-8 border rounded-lg w-full max-w-lg text-foreground">
 <Breadcrumbs
 items={[
 { label: "Dashboard", href: "/supplier/dashboard" },
 { label: "Cession Agreement", href: "/supplier/cession-agreement" },
 { label: "Upload" },
 ]}
 />
 <h1 className="mb-4 font-bold text-2xl">Upload Signed Cession Agreement</h1>
 <p className="mb-6 text-muted-foreground">
 Please upload your signed cession agreement PDF. Once submitted, your onboarding will be reviewed and you will be notified of approval.
 </p>
 <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
 <label htmlFor="cession-agreement-upload" className="font-medium">
 Signed Cession Agreement (PDF)
 </label>
 <FileUploadZone
 id="cession-agreement-upload"
 accept="application/pdf"
 maxFiles={1}
 maxSize={10 * 1024 * 1024}
 onFilesChange={(files) => {
	 setSelectedFiles(files);
	 if (files.length > 0) {
		 setError(null);
	 }
 }}
 onError={(message) => {
	 setError(message);
	 toast.error("✗ " + message);
 }}
 description="Upload a signed PDF (max 10MB)."
 />
 <Button type="submit" disabled={uploading}>{uploading ? "Uploading..." : "Submit Document"}</Button>
 </form>
 {error && <div className="mt-2 text-error text-center">{error}</div>}
 <div className="mt-6 text-center">
 <Link href="/supplier/dashboard" className="text-primary hover:underline">Back to Dashboard</Link>
 </div>
 </div>
 </div>
 );
}
