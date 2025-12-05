"use client";

import { useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import api from "@/lib/apiClient";
import { ImageIcon, X } from "lucide-react";
import { toast } from "sonner";

// --- Best Practice: Define constants for validation ---
const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function NewComicPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // --- Client-side validation for better UX and basic security ---
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error("Invalid file type. Please use JPG, PNG, or WEBP.");
      e.target.value = ""; // Reset file input
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      e.target.value = ""; // Reset file input
      return;
    }

    setCoverImageFile(file);
    setCoverImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setCoverImageFile(null);
    setCoverImagePreview(null);
    // It's good practice to also reset the file input element itself
    const fileInput = document.getElementById('cover-image-input') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title.");
      return;
    }

    setLoading(true);

    // Use FormData for multipart/form-data to handle file upload
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    if (coverImageFile) {
      formData.append("coverImage", coverImageFile);
    }

    try {
      await api.comics.createWithFormData(formData);
      toast.success("Comic created successfully!");
      router.push("/dashboard/creator/comics"); // Redirect to the list
      router.refresh(); // Ensures the new comic appears in the list
    } catch (error: any) {
      toast.error(error.message || "Failed to create comic. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-6">Create a New Comic</h2>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex flex-col space-y-6">
        <div>
          <label htmlFor="title" className="block mb-2 font-medium">Title</label>
          <Input
            id="title"
            placeholder="Enter comic title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="description" className="block mb-2 font-medium">Description</label>
          <Textarea
            id="description"
            placeholder="Short summary or description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="self-start">
          <label htmlFor="cover-image-input" className="block mb-2 font-medium">Cover Image (Optional)</label>
          <div> {/* This wrapper div is still important */}
            {coverImagePreview ? (
              <div className="relative inline-block">
                <Image
                  src={coverImagePreview}
                  alt="Cover preview"
                  width={160} // w-40 is 10rem = 160px
                  height={160} // h-40 is 10rem = 160px
                  className="object-cover rounded-md" />
                <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={removeImage}><X size={16} /></Button>
              </div>
            ) : (
              <div className="w-full border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center text-center">
                <ImageIcon className="h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">Supports: JPG, PNG, WEBP. Max 2MB.</p>
              </div>
            )}
          </div>
          <Input
            id="cover-image-input"
            type="file"
            className="mt-2"
            onChange={handleFileChange}
            accept={ALLOWED_FILE_TYPES.join(",")}
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full"
        >
          {loading ? "Creating..." : "Create Comic"}
        </Button>
      </form>
    </div>
  );
}
