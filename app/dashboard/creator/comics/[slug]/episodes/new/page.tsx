"use client";

import { useState, ChangeEvent, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageIcon, X, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import api from "@/lib/apiClient";
import { toast } from "sonner";

const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function NewEpisodeFormComponent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const comicSlug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const parentId = searchParams.get("parentId");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [episodeNumber, setEpisodeNumber] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return toast.error("Invalid file type. Please use JPG, PNG, or WEBP.");
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return toast.error(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
    }

    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    const fileInput = document.getElementById('thumbnail-input') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleSubmit = async () => {
    if (!title.trim() || !episodeNumber) {
      return toast.error("Title and Episode Number are required.");
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("episodeNumber", episodeNumber);

    if (parentId) {
      formData.append("parentId", parentId);
    }
    if (thumbnailFile) {
      formData.append("thumbnail", thumbnailFile);
    }
    if (publishedAt) {
      formData.append("publishedAt", publishedAt);
    }

    try {
      await api.episodes.create(comicSlug, formData);
      toast.success("Episode created successfully!");
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
      <h2 className="text-xl font-semibold mb-6">
        {parentId ? "Create New Sub-Episode" : "Create New Episode"}
      </h2>
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex flex-col space-y-6">
        <div>
          <label htmlFor="title" className="block mb-2 font-medium">Title</label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label htmlFor="episodeNumber" className="block mb-2 font-medium">Episode Number</label>
          <Input id="episodeNumber" type="number" value={episodeNumber} onChange={(e) => setEpisodeNumber(e.target.value)} />
        </div>
        <div>
          <label htmlFor="description" className="block mb-2 font-medium">Description</label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
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
        <div className="self-start">
          <label htmlFor="thumbnail-input" className="block mb-2 font-medium">Thumbnail (Optional)</label>
          {thumbnailPreview ? (
            <div className="relative inline-block"><Image src={thumbnailPreview} alt="Thumbnail preview" width={160} height={160} className="object-cover rounded-md" /><Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={removeImage}><X size={16} /></Button></div>
          ) : (
            <div className="w-40 h-40 border-2 border-dashed rounded-md flex flex-col items-center justify-center text-gray-500"><ImageIcon size={32} /><p className="mt-2 text-xs">Add Thumbnail</p></div>
          )}
          <Input id="thumbnail-input" type="file" className="mt-2" onChange={handleFileChange} accept={ALLOWED_FILE_TYPES.join(",")} />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : "Create Episode"}
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

export default function NewEpisodePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewEpisodeFormComponent />
    </Suspense>
  );
}