"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/apiClient";

interface PostDTO {
  id: number;
  title: string;
  description?: string | null;
  postNumber: number;
}

interface EpisodeDTO {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  posts: PostDTO[];
  childEpisodes: EpisodeDTO[];
}

interface ComicDetailDTO {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  episodes: EpisodeDTO[];
}

export default function ComicDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  const [loading, setLoading] = useState(true);
  const [comic, setComic] = useState<ComicDetailDTO | null>(null);

  useEffect(() => {
    if (!slug) return;
    loadComicDetails();
  }, [slug]);

  async function loadComicDetails() {
    setLoading(true);
    try {
      // This should be updated to a real API client call
      const comicRes = await (await fetch(`/api/creator/comics/${slug}`)).json();
      setComic(comicRes.comic);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to load comic or posts");
    } finally {
      setLoading(false);
    }
  }

  if (loading || !comic) {
    return <div className="p-6 bg-white rounded-xl shadow-md max-w-xl">Loading comic…</div>;
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-md max-w-2xl">
      <h2 className="text-2xl font-semibold mb-2">{comic.title}</h2>
      <p className="text-gray-700 mb-6">{comic.description}</p>

      <div className="flex gap-4 mb-6">
        <Button onClick={() => router.push(`/dashboard/creator/comics/${slug}/episodes/new`)}>
          + New Episode
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push(`/dashboard/creator/comics/${slug}/posts/new`)}
        >
          + New Post
        </Button>
      </div>

      <h3 className="text-xl font-semibold mb-3">Episodes & Posts</h3>

      {comic.episodes.length === 0 ? (
        <p className="text-gray-500 italic">No episodes yet.</p>
      ) : (
        <div className="space-y-3">
          {comic.episodes.map((episode) => (
            <div key={episode.id} className="p-4 border rounded-lg">
              <h4 className="font-semibold text-lg">{episode.title}</h4>
              {episode.description && (
                <p className="text-sm text-gray-600 mb-2">{episode.description}</p>
              )}
              <div className="pl-4 mt-2 space-y-2 border-l-2">
                {episode.posts.length === 0 && (
                  <p className="text-xs text-gray-500 italic">No posts in this episode.</p>
                )}
                {episode.posts.map((post) => (
                  <div
                    key={post.id}
                    className="p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                    onClick={() =>
                      router.push(`/dashboard/creator/comics/${slug}/posts/${post.id}`)
                    }
                  >
                    <p className="font-medium text-sm">{post.title}</p>
                    {post.description && (
                      <p className="text-xs text-gray-500 truncate">{post.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
