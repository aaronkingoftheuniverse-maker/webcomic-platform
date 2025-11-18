"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function CreatorProfilePage() {
  const [profile, setProfile] = useState({ bio: "", website: "", avatarUrl: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/creator/profile")
      .then((res) => res.json())
      .then((data) => setProfile(data || {}));
  }, []);

  const handleSave = async () => {
    setLoading(true);
    await fetch("/api/creator/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    setLoading(false);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md max-w-lg">
      <h2 className="text-xl font-semibold mb-4">Creator Profile</h2>
      <label className="block mb-2">Bio</label>
      <Textarea
        value={profile.bio || ""}
        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
      />
      <label className="block mt-4 mb-2">Website</label>
      <Input
        value={profile.website || ""}
        onChange={(e) => setProfile({ ...profile, website: e.target.value })}
      />
      <label className="block mt-4 mb-2">Avatar URL</label>
      <Input
        value={profile.avatarUrl || ""}
        onChange={(e) => setProfile({ ...profile, avatarUrl: e.target.value })}
      />
      <Button onClick={handleSave} className="mt-4" disabled={loading}>
        {loading ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
