"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import api from "@/lib/apiClient";
import { toast } from "sonner";
import {
  ComicCard,
  ComicCardData,
} from "@/components/comics/ComicCard"; // Adjust path as needed

export default function ComicsListPage() {
  const [comics, setComics] = useState<ComicCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadComics() {
      try {
        // The response from this API call must now include the `lastPostedAt` field.
        const data = await api.comics.list();
        setComics(data.comics);
      } catch (error: any) {
        console.error("Error loading comics:", error);
        toast.error("Failed to load comics: " + error.message);
        setComics([]); // Ensure comics is an empty array on error
      } finally {
        setLoading(false);
      }
    }

    loadComics();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin h-6 w-6 text-gray-400" />
      </div>
    );

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">My Comics</h2>
        <Link href="/dashboard/creator/comics/new">
          <Button>Create New Comic</Button>
        </Link>
      </div>

      {comics.length === 0 ? (
        <p className="text-gray-600">You haven’t created any comics yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {comics.map((comic) => (
            <ComicCard
              key={comic.id}
              comic={comic}
              linkHref={`/dashboard/creator/comics/${comic.slug}`}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
