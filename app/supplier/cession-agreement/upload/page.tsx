"use client" 
import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SupplierCessionAgreementUploadPage() {
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setUploading(true);
    const form = e.currentTarget;
    const fileInput = form.querySelector<HTMLInputElement>("#cession-agreement-upload");
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      setError("Please select a PDF file to upload.");
      setUploading(false);
      return;
    }
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/cession-agreement/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = "/supplier/dashboard";
      } else {
        setError(data.error || "Upload failed");
      }
    } catch (err: any) {
      setError("Upload failed");
    }
    setUploading(false);
  }

  return (
    <div className="flex flex-col justify-center items-center bg-muted/30 min-h-screen">
      <div className="bg-background shadow p-8 border rounded-lg w-full max-w-lg text-foreground">
        <h1 className="mb-4 font-bold text-2xl">Upload Signed Cession Agreement</h1>
        <p className="mb-6 text-muted-foreground">
          Please upload your signed cession agreement PDF. Once submitted, your onboarding will be reviewed and you will be notified of approval.
        </p>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <label htmlFor="cession-agreement-upload" className="font-medium">
            Signed Cession Agreement (PDF)
          </label>
          <input
            id="cession-agreement-upload"
            type="file"
            accept="application/pdf"
            className="px-3 py-2 border rounded"
            title="Upload your signed cession agreement PDF"
            placeholder="Choose PDF file"
            required
          />
          <Button type="submit" disabled={uploading}>{uploading ? "Uploading..." : "Submit Document"}</Button>
        </form>
        {error && <div className="mt-2 text-red-600 text-center">{error}</div>}
        <div className="mt-6 text-center">
          <Link href="/supplier/dashboard" className="text-primary hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
