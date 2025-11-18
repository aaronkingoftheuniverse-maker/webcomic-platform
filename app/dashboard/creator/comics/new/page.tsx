"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function NewComicPage() {
  const router = useRouter();
  const [comic, setComic] = useState({ title: "", description: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!comic.title.trim()) {
      toast.error("Please enter a title.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/creator/comics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(comic),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Failed to create comic.");
      return;
    }

    toast.success("Comic created successfully!");
    router.push("/dashboard/creator/comics");
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md max-w-lg">
      <h2 className="text-xl font-semibold mb-4">Create a New Comic</h2>

      <label className="block mb-2 font-medium">Title</label>
      <Input
        placeholder="Enter comic title"
        value={comic.title}
        onChange={(e) => setComic({ ...comic, title: e.target.value })}
      />

      <label className="block mt-4 mb-2 font-medium">Description</label>
      <Textarea
        placeholder="Short summary or description..."
        value={comic.description}
        onChange={(e) => setComic({ ...comic, description: e.target.value })}
      />

      <Button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-4 w-full"
      >
        {loading ? "Creating..." : "Create Comic"}
      </Button>
    </div>
  );
}
