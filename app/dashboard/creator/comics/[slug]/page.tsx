"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/apiClient";

interface ComicDTO {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  coverImage?: string | null;
  createdAt: string;
}

interface PostDTO {
  id: number;
  title: string;
  description?: string | null;
  postNumber: number;
  createdAt: string;
}

export default function ComicDetailPage() {
  const router = useRouter();
  const { slug } = useParams(); // comicSlug

  const [loading, setLoading] = useState(true);
  const [comic, setComic] = useState<ComicDTO | null>(null);
  const [posts, setPosts] = useState<PostDTO[]>([]);

  useEffect(() => {
    if (!slug) return;
    loadComicAndPosts();
  }, [slug]);

  async function loadComicAndPosts() {
    setLoading(true);
    try {
      const comicRes = await api.comics.get(slug);
      setComic(comicRes.comic);

      const postsRes = await api.posts.list(slug); // <- updated to use [slug]/posts
      setPosts(postsRes.posts ?? []);
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

      <Button
        className="mb-6"
        onClick={() => router.push(`/dashboard/creator/comics/${slug}/posts/new`)}
      >
        + New Post
      </Button>

      <h3 className="text-xl font-semibold mb-3">Posts</h3>

      {posts.length === 0 ? (
        <p className="text-gray-500 italic">No posts yet.</p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => router.push(`/dashboard/creator/comics/${slug}/posts/${post.id}`)}
            >
              <h4 className="font-medium">{post.title}</h4>
              <p className="text-sm text-gray-600 truncate">{post.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
