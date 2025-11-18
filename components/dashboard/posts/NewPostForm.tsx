"use client";

import { useState } from "react";
import useUpload from "@/hooks/useUpload";
import { useRouter } from "next/navigation";

export default function NewPostForm({ comicId }: { comicId: number }) {
  const router = useRouter();
  const { uploadFiles, uploading } = useUpload();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);

    const uploaded = await uploadFiles(selectedFiles);
    if (!uploaded.ok) return;

    const res = await fetch("/api/creator/posts", {
      method: "POST",
      body: JSON.stringify({
        comicId,
        title,
        description,
        images: uploaded.urls.map((url) => ({
          filename: url.split("/").pop()!,
          storagePath: url,
          storageProvider: "LOCAL",
        })),
      }),
    });

    setSaving(false);

    if (!res.ok) {
      alert("Failed to save post.");
      return;
    }

    router.refresh();
    router.push(`/dashboard/creator/comics/${comicId}/posts`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <div>
        <label className="block font-semibold mb-1">Title</label>
        <input
          required
          className="border p-2 w-full rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div>
        <label className="block font-semibold mb-1">Description</label>
        <textarea
          className="border p-2 w-full rounded"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div>
        <label className="block font-semibold mb-1">Images</label>
        <input
          type="file"
          multiple
          onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
        />
      </div>

      <button
        disabled={saving || uploading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {saving ? "Saving..." : uploading ? "Uploading..." : "Create Post"}
      </button>
    </form>
  );
}
