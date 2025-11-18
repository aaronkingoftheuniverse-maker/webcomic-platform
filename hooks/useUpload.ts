"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function useUpload() {
  const [uploading, setUploading] = useState(false);

  async function uploadFiles(files: File[]) {
    setUploading(true);

    const form = new FormData();
    files.forEach((file) => form.append("files", file));

    const res = await fetch("/api/creator/uploads", {
      method: "POST",
      body: form,
      cache: "no-store",
    });

    setUploading(false);

    if (!res.ok) {
      toast.error("Upload failed");
      return { ok: false, urls: [] };
    }

    const data = await res.json();
    return { ok: true, urls: data.urls as string[] };
  }

  return { uploadFiles, uploading };
}
