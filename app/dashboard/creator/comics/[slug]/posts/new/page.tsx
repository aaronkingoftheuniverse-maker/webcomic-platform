"use client";

import { useState, ChangeEvent, Suspense } from "react";
import { useRouter, useParams, useSearchParams, notFound } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageIcon, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function NewPostFormComponent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const comicSlug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const episodeId = searchParams.get("episodeId");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [thumbnailIndex, setThumbnailIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  if (!episodeId || isNaN(Number(episodeId))) {
    return <div className="text-red-500">Error: Episode ID is missing from the URL.</div>;
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(file => {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast.error(`Invalid file type: ${file.name}`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(`File too large: ${file.name}`);
        return false;
      }
      return true;
    });

    setImageFiles(prev => [...prev, ...validFiles]);
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);

    // If no thumbnail is set, set the first uploaded image as the default
    if (thumbnailIndex === null && validFiles.length > 0) {
      setThumbnailIndex(imageFiles.length);
    }

    e.target.value = ""; // Reset file input
  };

  const removeImage = (index: number) => {
    setImageFiles(files => files.filter((_, i) => i !== index));
    setImagePreviews(previews => previews.filter((_, i) => i !== index));
    if (thumbnailIndex === index) {
      setThumbnailIndex(imageFiles.length > 1 ? 0 : null);
    } else if (thumbnailIndex !== null && thumbnailIndex > index) {
      setThumbnailIndex(thumbnailIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) return toast.error("Post title is required.");

    setLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("episodeId", episodeId);

    imageFiles.forEach(file => {
      formData.append("images", file);
    });

    if (thumbnailIndex !== null) {
      formData.append("thumbnailIndex", String(thumbnailIndex));
    }

    if (publishedAt) {
      formData.append("publishedAt", publishedAt);
    }

    try {
      const res = await fetch(`/api/creator/posts`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create post.");
      }

      toast.success("Post created successfully!");
      router.push(`/dashboard/creator/comics/${comicSlug}`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-6">Create New Post</h2>
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex flex-col space-y-6">
        {/* Title and Description fields... */}
        <div>
          <label htmlFor="title" className="block mb-2 font-medium">Title</label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label htmlFor="description" className="block mb-2 font-medium">Description</label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        {/* Publish Status */}
        <div className="space-y-2 rounded-lg border p-4">
          <label className="font-semibold">Publish Status</label>
          <div className="flex items-center space-x-2">
            <Switch
              id="publish-status"
              checked={!!publishedAt}
              onCheckedChange={(checked) => {
                setPublishedAt(checked ? new Date().toISOString() : null);
              }}
            />
            <Label htmlFor="publish-status">
              {publishedAt ? "Published / Scheduled" : "Draft"}
            </Label>
          </div>
          {publishedAt && (
            <div className="pt-2">
              <Label htmlFor="publish-date">Publish Date</Label>
              <Input
                id="publish-date"
                type="datetime-local"
                value={formatDateForInput(publishedAt)}
                onChange={(e) =>
                  setPublishedAt(e.target.value ? new Date(e.target.value).toISOString() : null)
                }
              />
            </div>
          )}
        </div>
        {/* Image Uploader */}
        <div>
          <label className="block mb-2 font-medium">Post Images</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {imagePreviews.map((src, index) => (
              <div key={index} className="relative group">
                <Image src={src} alt={`Preview ${index}`} width={160} height={160} className={`object-cover rounded-md aspect-square transition-all ${thumbnailIndex === index ? 'ring-4 ring-offset-2 ring-blue-500' : ''}`} />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {thumbnailIndex !== index && (
                    <Button variant="ghost" size="sm" onClick={() => setThumbnailIndex(index)}>Set Thumb</Button>
                  )}
                </div>
                {thumbnailIndex === index && <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">Thumb</div>}
                <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => removeImage(index)}><X size={16} /></Button>
              </div>
            ))}
            <label htmlFor="image-upload" className="cursor-pointer aspect-square border-2 border-dashed rounded-md flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50">
              <ImageIcon size={32} />
              <span className="text-xs mt-1">Add Image</span>
            </label>
          </div>
          <Input id="image-upload" type="file" multiple className="hidden" onChange={handleFileChange} accept={ALLOWED_FILE_TYPES.join(",")} />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : "Create Post"}
        </Button>
      </form>
    </div>
  );
}

/**
 * Formats an ISO date string into a `YYYY-MM-DDTHH:mm` string
 * suitable for a datetime-local input.
 */
function formatDateForInput(isoString: string | null): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  // Adjust for timezone offset to display local time correctly in the input
  const timezoneOffset = date.getTimezoneOffset() * 60000; // in milliseconds
  const localDate = new Date(date.getTime() - timezoneOffset);
  return localDate.toISOString().slice(0, 16);
}

export default function NewPostPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewPostFormComponent />
    </Suspense>
  );
}