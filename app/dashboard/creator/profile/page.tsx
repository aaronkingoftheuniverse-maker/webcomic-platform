"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Edit, Save, X } from "lucide-react";
import api from "@/lib/apiClient";
import { CreatorProfile, UpdateCreatorProfilePayload } from "@/types/api/creator";

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

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await api.creator.getProfile();
        setProfile(data);
        setEditableProfile(data);
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

  const handleSave = async () => {
    setLoading(true);
    try {
      const updatedProfile = await api.creator.saveProfile(editableProfile);
      setProfile(updatedProfile); // The returned profile is the full object
      setEditableProfile(updatedProfile);
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
        <div>
          <label className="font-semibold">Avatar URL</label>
          {isEditing ? (
            <Input value={editableProfile.avatarUrl || ""} onChange={(e) => setEditableProfile({ ...editableProfile, avatarUrl: e.target.value })} />
          ) : (
            <p className="text-gray-700">{profile?.avatarUrl || "No avatar URL provided."}</p>
          )}
        </div>
      </div>
    </div>
  );
}
