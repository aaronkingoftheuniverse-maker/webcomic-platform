"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ComicDTO {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  coverImage?: string | null;
  createdAt: string;
}

interface PostDTO {
  id: number;
  title: string;
  description: string | null;
  postNumber: number;
  createdAt: string;
}

export default function ComicDetailPage() {
  const router = useRouter();
 const { slug } = useParams();


  const [loading, setLoading] = useState(true);
  const [comic, setComic] = useState<ComicDTO | null>(null);
  const [posts, setPosts] = useState<PostDTO[]>([]);

useEffect(() => {
  if (!slug) return;
  loadComicAndPosts();
}, [slug]);

  async function loadComicAndPosts() {
  setLoading(true);

  const idOrSlug = slug;

  try {
    // --- Load Comic ---

const comicRes = await fetch(`/api/creator/comics/${idOrSlug}`);
    const comicData = await comicRes.json();

    if (!comicRes.ok) {
      toast.error(comicData.error || "Failed to load comic.");
      setLoading(false);
      return;
    }

    setComic(comicData.comic);

    // --- Load Posts ---
const postsRes = await fetch(`/api/creator/posts?comicId=${idOrSlug}`);
    const postsData = await postsRes.json();

    if (!postsRes.ok) {
      toast.error(postsData.error || "Failed to load posts.");
    } else {
      setPosts(postsData.posts);
    }

  } catch (err) {
    console.error(err);
    toast.error("Unexpected error loading comic.");
  }

  setLoading(false);
}


  if (loading || !comic) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-md max-w-xl">
        Loading comic…
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-md max-w-2xl">
      <h2 className="text-2xl font-semibold mb-2">{comic.title}</h2>
      <p className="text-gray-700 mb-6">{comic.description}</p>

      <Button
        className="mb-6"
        onClick={() =>
          router.push(`/dashboard/creator/comics/${slug}/posts/new`)
        }
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
              onClick={() =>
                router.push(`/dashboard/creator/comics/${slug}/posts/${post.id}`)
              }
            >
              <h4 className="font-medium">{post.title}</h4>
              <p className="text-sm text-gray-600 truncate">
                {post.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
