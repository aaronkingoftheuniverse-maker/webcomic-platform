"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import useUpload from "@/hooks/useUpload";

export default function NewPostForm() {
  const router = useRouter();

  const [post, setPost] = useState({
    title: "",
    body: "",
  });

  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const { uploadFiles, uploading } = useUpload();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const selected = Array.from(files);
    setImages(selected);

    const previews = selected.map((f) => URL.createObjectURL(f));
    setPreviewUrls(previews);
  };

  const handleSubmit = async () => {
    if (!post.title.trim()) {
      toast.error("Please enter a title.");
      return;
    }

    // ⏳ Upload images first
    let uploadedUrls: string[] = [];

    if (images.length > 0) {
      const result = await uploadFiles(images);

      if (!result.ok) {
        toast.error("Image upload failed.");
        return;
      }

      uploadedUrls = result.urls;
    }

    // 📦 Create post
    const res = await fetch("/api/creator/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...post,
        images: uploadedUrls,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Failed to create post.");
      return;
    }

    toast.success("Post created!");
    router.push("/dashboard/creator/posts");
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block mb-2 font-medium">Title</label>
        <Input
          placeholder="Post title"
          value={post.title}
          onChange={(e) => setPost({ ...post, title: e.target.value })}
        />
      </div>

      <div>
        <label className="block mb-2 font-medium">Body</label>
        <Textarea
          placeholder="Write your post..."
          value={post.body}
          onChange={(e) => setPost({ ...post, body: e.target.value })}
          rows={6}
        />
      </div>

      <div>
        <label className="block mb-2 font-medium">Upload Images</label>
        <Input type="file" multiple accept="image/*" onChange={handleImageSelect} />
      </div>

      {previewUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-4">
          {previewUrls.map((url, idx) => (
            <img
              key={idx}
              src={url}
              className="h-32 w-full object-cover rounded-md border"
            />
          ))}
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={uploading}
        className="w-full mt-4"
      >
        {uploading ? "Uploading..." : "Create Post"}
      </Button>
    </div>
  );
}
