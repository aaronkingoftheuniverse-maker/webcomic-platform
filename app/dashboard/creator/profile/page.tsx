"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Edit, Save, X, ImageIcon, Trash2 } from "lucide-react";
import api from "@/lib/apiClient";
import { CreatorProfile, UpdateCreatorProfilePayload } from "@/types/api/creator";

const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function getImageUrl(relativePath: string | null | undefined): string | null {
  if (!relativePath) return null;
  const baseUrl = process.env.NEXT_PUBLIC_STORAGE_BASE_URL;
  if (!baseUrl) return relativePath;
  if (baseUrl.startsWith("http")) return new URL(relativePath, baseUrl).href;
  return `${baseUrl.replace(/\/$/, "")}/${relativePath.replace(/^\//, "")}`;
}

const initialProfileState: CreatorProfile = {
  id: 0, // Default values for the full type
  userId: 0,
  bio: "",
  website: "",
  avatarUrl: "",
  createdAt: "",
  updatedAt: "",
};

export default function CreatorProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [editableProfile, setEditableProfile] = useState<UpdateCreatorProfilePayload>(initialProfileState);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await api.creator.getProfile();
        setProfile(data);
        setEditableProfile(data);
        setAvatarPreview(data.avatarUrl ? getImageUrl(data.avatarUrl) : null);
      } catch (error: any) {
        if (error.response?.status === 404) {
          // Profile doesn't exist, start in editing mode.
          setProfile(initialProfileState);
          setEditableProfile(initialProfileState);
          setIsEditing(true);
        } else {
          toast.error("Failed to load profile: " + error.message);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return toast.error("Invalid file type. Please use JPG, PNG, or WEBP.");
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return toast.error(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setEditableProfile(prev => ({ ...prev, avatarUrl: null }));
    const fileInput = document.getElementById('avatar-input') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      // Always append the fields, even if they are empty strings, so the backend can process them.
      // The backend will receive `null` if the field was never edited, or a string (even empty) if it was.
      formData.append("bio", editableProfile.bio ?? "");
      formData.append("website", editableProfile.website ?? "");
      if (avatarFile) formData.append("avatar", avatarFile);

      const updatedProfile = await api.creator.saveProfile(formData);
      setProfile(updatedProfile); // The returned profile is the full object
      setEditableProfile(updatedProfile);
      setAvatarFile(null);
      setIsEditing(false);
      toast.success("Profile saved successfully!");
      router.refresh();
    } catch (error: any) {
      toast.error("Failed to save profile: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // If the profile has an ID, it exists, so we can revert to view mode.
    if (profile?.id) {
      setEditableProfile(profile); // Revert to the last saved state
      setAvatarPreview(profile.avatarUrl ? getImageUrl(profile.avatarUrl) : null);
      setIsEditing(false);
    } else {
      // If there's no ID, it's a new profile. "Cancel" should go back.
      router.back();
    }
  };

  if (loading && profile === null) {
    return <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-md max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Creator Profile</h2>
        {isEditing ? (
          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm" disabled={loading}>
              <Save className="mr-2 h-4 w-4" /> {loading ? "Saving..." : "Save"}
            </Button>
            <Button onClick={handleCancel} size="sm" variant="outline">
              <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
          </div>
        ) : (
          <Button onClick={() => setIsEditing(true)} size="sm" variant="ghost">
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
        )}
      </div>

      {profile && !isEditing && (
        <div className="border-t pt-4">
          <h3 className="font-semibold">Subscribers</h3>
          <p className="text-gray-700">{profile._count?.subscribers ?? 0}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="font-semibold">Bio</label>
          {isEditing ? (
            <Textarea value={editableProfile.bio || ""} onChange={(e) => setEditableProfile({ ...editableProfile, bio: e.target.value })} />
          ) : (
            <p className="text-gray-700 whitespace-pre-wrap">{profile?.bio || "No bio provided."}</p>
          )}
        </div>
        <div>
          <label className="font-semibold">Website</label>
          {isEditing ? (
            <Input value={editableProfile.website || ""} onChange={(e) => setEditableProfile({ ...editableProfile, website: e.target.value })} />
          ) : (
            <p className="text-gray-700">{profile?.website || "No website provided."}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="font-semibold">Avatar</label>
          {isEditing ? (
            <div className="w-40">
              {avatarPreview ? (
                <div>
                  <Image src={avatarPreview} alt="Avatar preview" width={160} height={160} className="object-cover rounded-full aspect-square" />
                  <Button variant="destructive" size="sm" className="mt-2 w-full" onClick={removeAvatar}><Trash2 className="w-4 h-4 mr-2" /> Remove</Button>
                </div>
              ) : (
                <div className="w-40 h-40 border-2 border-dashed rounded-full flex flex-col items-center justify-center text-gray-500"><ImageIcon size={32} /><p className="mt-2 text-xs">Add Avatar</p></div>
              )}
              <Input id="avatar-input" type="file" className="mt-2" onChange={handleFileChange} accept={ALLOWED_FILE_TYPES.join(",")} />
            </div>
          ) : (
            avatarPreview ? (
              <Image src={avatarPreview} alt="Creator avatar" width={160} height={160} className="object-cover rounded-full aspect-square" />
            ) : (
              <p className="text-gray-500 italic">No avatar set.</p>
            )
          )}
        </div>
      </div>
    </div>
  );
}
