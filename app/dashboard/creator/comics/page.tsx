"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Loader2, ImageIcon } from "lucide-react";

type ComicWithCounts = {
  id: number;
  title: string;
  slug: string;
  coverImage: string | null;
  description: string | null;
  episodeCount: number;
  postCount: number;
};

/**
 * Constructs the full URL for a stored image.
 * Prepends the base storage URL from environment variables.
 * @param relativePath - The path of the image relative to the storage root.
 */
function getImageUrl(relativePath: string | null): string | null {
  if (!relativePath) return null;
  return `${process.env.NEXT_PUBLIC_STORAGE_BASE_URL}${relativePath}`;
}

export default function ComicsListPage() {
  const [comics, setComics] = useState<ComicWithCounts[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/creator/comics")
      .then((res) => {
        if (!res.ok) {
          // If response is not 2xx, throw an error to be caught below
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data?.comics)) {
          setComics(data.comics);
        } else {
          console.error("Unexpected response:", data);
          setComics([]);
        }
      })
      .catch((err) => {
        console.error("Error loading comics:", err);
        setComics([]);
      })
      .finally(() => setLoading(false));
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
            <li key={comic.id} className="py-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-shrink-0">
                  {getImageUrl(comic.coverImage) ? (
                    <Image
                      src={getImageUrl(comic.coverImage)!}
                      alt={`Cover for ${comic.title}`}
                      width={80}
                      height={80}
                      className="object-cover rounded-md w-20 h-20 bg-gray-100"
                      priority={false} // Optional: set to true for above-the-fold images
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center text-gray-400"><ImageIcon size={32} /></div>
                  )}
                </div>
                <div className="flex-grow">
                  <h3 className="font-semibold">{comic.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {comic.description || "No description"}
                  </p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span>
                      {comic.episodeCount} {comic.episodeCount === 1 ? "Episode" : "Episodes"}
                    </span>
                    <span>{comic.postCount} {comic.postCount === 1 ? "Post" : "Posts"}</span>
                  </div>
                </div>
                <Link
                  href={`/dashboard/creator/comics/${comic.slug}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  View
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
