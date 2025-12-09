"use client";

import { useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageIcon, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function NewCreatorProfilePage() {
  const router = useRouter();
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error("Invalid file type. Please use JPG, PNG, or WEBP.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      e.target.value = "";
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    const fileInput = document.getElementById('avatar-input') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleSubmit = async () => {
    setLoading(true);

    const formData = new FormData();
    formData.append("bio", bio);
    formData.append("website", website);
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    try {
      // We assume the API will be updated to handle FormData
      const res = await fetch('/api/creator/profile', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create profile.");
      }

      toast.success("Creator Profile created successfully!");
      router.push("/dashboard/creator/profile"); // Redirect to the profile view/edit page
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-6">Become a Creator</h2>
      <p className="text-sm text-gray-600 mb-6">
        Create your public creator profile. This will be visible to all users and is the first step to publishing your work.
      </p>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex flex-col space-y-6">
        <div>
          <label htmlFor="bio" className="block mb-2 font-medium">Bio</label>
          <Textarea
            id="bio"
            placeholder="Tell everyone a little about yourself and your work..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="website" className="block mb-2 font-medium">Website (Optional)</label>
          <Input
            id="website"
            type="url"
            placeholder="https://your-portfolio.com"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        <div className="self-start">
          <label htmlFor="avatar-input" className="block mb-2 font-medium">Avatar (Optional)</label>
          {avatarPreview ? (
            <div className="relative inline-block">
              <Image src={avatarPreview} alt="Avatar preview" width={160} height={160} className="object-cover rounded-full w-40 h-40" />
              <Button variant="destructive" size="icon" className="absolute top-0 right-0 h-8 w-8 rounded-full" onClick={removeImage}><X size={16} /></Button>
            </div>
          ) : (
            <label htmlFor="avatar-input" className="cursor-pointer w-40 h-40 border-2 border-dashed rounded-full flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50">
              <ImageIcon size={32} />
              <p className="mt-2 text-xs">Add Avatar</p>
            </label>
          )}
          <Input id="avatar-input" type="file" className="hidden" onChange={handleFileChange} accept={ALLOWED_FILE_TYPES.join(",")} />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Profile</> : "Create Profile"}
        </Button>
      </form>
    </div>
  );
}
