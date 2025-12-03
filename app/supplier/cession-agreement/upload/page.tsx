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
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30">
      <div className="max-w-lg w-full bg-background text-foreground rounded-lg shadow p-8 border">
        <h1 className="text-2xl font-bold mb-4">Upload Signed Cession Agreement</h1>
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
            className="border rounded px-3 py-2"
            title="Upload your signed cession agreement PDF"
            placeholder="Choose PDF file"
            required
          />
          <Button type="submit" disabled={uploading}>{uploading ? "Uploading..." : "Submit Document"}</Button>
        </form>
        {error && <div className="text-red-600 mt-2 text-center">{error}</div>}
        <div className="mt-6 text-center">
          <Link href="/supplier/dashboard" className="text-primary hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
