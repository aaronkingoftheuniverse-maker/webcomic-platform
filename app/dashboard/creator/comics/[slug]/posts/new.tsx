"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import useUpload from "@/hooks/useUpload";
import api from "@/lib/apiClient";

export default function NewPostForm({ comicSlug }: { comicSlug: string }) {
  const router = useRouter();
  const { uploadFiles, uploading } = useUpload();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Title required");

    setSaving(true);

    // Upload images first
    let uploadedImages = [];
    if (selectedFiles.length > 0) {
      const result = await uploadFiles(selectedFiles);
      if (!result.ok) {
        toast.error("Image upload failed");
        setSaving(false);
        return;
      }
      uploadedImages = result.urls.map((url) => ({
        filename: url.split("/").pop()!,
        storagePath: url,
        storageProvider: "LOCAL",
      }));
    }

    try {
      await api.posts.create(comicSlug, {
        title,
        description,
        images: uploadedImages,
        comicId: 0, // ignored; slug is authoritative
      });
      toast.success("Post created!");
      router.push(`/dashboard/creator/comics/${comicSlug}/posts`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to create post");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <div>
        <label className="block font-semibold mb-1">Title</label>
        <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div>
        <label className="block font-semibold mb-1">Description</label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div>
        <label className="block font-semibold mb-1">Images</label>
        <input type="file" multiple onChange={handleImageSelect} />
      </div>

      <Button type="submit" disabled={saving || uploading}>
        {saving ? "Saving..." : uploading ? "Uploading..." : "Create Post"}
      </Button>
    </form>
  );
}
