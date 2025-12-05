"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ImageIcon, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/apiClient";

import { ComicDetailDTO } from "@/types/api/comics"; // Import from types file
import { EpisodeDTO } from "@/types/api/episodes"; // Import from types file
import { PostDTO } from "@/types/api/posts"; // Import from types file


/**
 * Constructs the full URL for a stored image.
 * Prepends the base storage URL from environment variables.
 */
function getImageUrl(relativePath: string | null): string | null {
  if (!relativePath) return null;
  return `${process.env.NEXT_PUBLIC_STORAGE_BASE_URL}${relativePath}`;
}

export default function ComicDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  const [loading, setLoading] = useState(true);
  const [comic, setComic] = useState<ComicDetailDTO | null>(null);

  console.log("[PAGE] Component rendered with slug:", slug);
  console.log("PAGE!!!!!!!!!! slug:", slug);

  useEffect(() => {
    if (!slug) return;
    loadComicDetails();
  }, [slug]);

  async function loadComicDetails() {
    console.log(`[PAGE] ==> Fetching data for slug: ${slug}`);
    setLoading(true);
    try {
      const response = await api.comics.get(slug);
      console.log("[PAGE] <== Received API response:", response);
      setComic(response.comic);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to load comic or posts");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-6 bg-white rounded-xl shadow-md max-w-xl">Loading comic...</div>;
  }
  if (!comic) {
    return <div className="p-6 bg-white rounded-xl shadow-md max-w-xl text-red-500">Comic not found.</div>;
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-md max-w-4xl">
      <h2 className="text-2xl font-semibold mb-2">{comic.title}</h2>
      <p className="text-gray-700 mb-6">{comic.description}</p>

      <div className="flex gap-4 mb-6">
        <Button onClick={() => router.push(`/dashboard/creator/comics/${slug}/episodes/new`)}>
          + New Episode
        </Button>
      </div>

      <h3 className="text-xl font-semibold mb-3 border-b pb-2">Content Structure</h3>

      <TooltipProvider>
        {comic.episodes.length === 0 ? (
          <p className="text-gray-500 italic">No episodes yet.</p>
        ) : (
          <div className="space-y-1">
            {comic.episodes.map((episode) => (
              <EpisodeItem key={episode.id} episode={episode} comicSlug={slug} level={0} />
            ))}
          </div>
        )}
      </TooltipProvider>
    </div>
  );
}

// Reusable component for rendering an Episode and its children
function EpisodeItem({ episode, comicSlug, level }: { episode: EpisodeDTO; comicSlug: string; level: number }) {
  const router = useRouter();
  const indentation = { paddingLeft: `${level * 2}rem` };

  return (
    <div>
      <div style={indentation} className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-gray-100">
        <ItemThumbnail src={getImageUrl(episode.thumbnailUrl)} alt={episode.title} />
        <span className="font-semibold flex-grow">{episode.title}</span>
        <div className="flex items-center gap-3 text-xs">
          <Link href={`/dashboard/creator/comics/${comicSlug}/posts/new?episodeId=${episode.id}`} className="text-gray-500 hover:text-blue-600 flex items-center gap-1">
            <PlusCircle size={14} /> Post
          </Link>
          <Link href={`/dashboard/creator/comics/${comicSlug}/episodes/new?parentId=${episode.id}`} className="text-gray-500 hover:text-blue-600 flex items-center gap-1">
            <PlusCircle size={14} /> Episode
          </Link>
          <Link href={`/dashboard/creator/comics/${comicSlug}/episodes/${episode.id}`} className="text-blue-600 hover:underline">
            edit
          </Link>
        </div>
      </div>
      <div className="space-y-1">
        {episode.posts.map(post => (
          <PostItem key={post.id} post={post} comicSlug={comicSlug} level={level + 1} />
        ))}
        {(episode.childEpisodes || []).map(child => (
          <EpisodeItem key={child.id} episode={child} comicSlug={comicSlug} level={level + 1} />
        ))}
      </div>
    </div>
  );
}

// Reusable component for rendering a Post
function PostItem({ post, comicSlug, level }: { post: PostDTO; comicSlug: string; level: number }) {
  const indentation = { paddingLeft: `${level * 2}rem` };

  return (
    <div style={indentation} className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-gray-100">
      <ItemThumbnail src={getImageUrl(post.thumbnailImage?.filename)} alt={post.title} />
      <span className="flex-grow">{post.title}</span>
      <div className="flex items-center gap-3 text-xs">
        <Link href={`/dashboard/creator/comics/${comicSlug}/posts/${post.id}`} className="text-blue-600 hover:underline">
          edit
        </Link>
      </div>
    </div>
  );
}

// Reusable component for the small thumbnail with a tooltip
function ItemThumbnail({ src, alt }: { src: string | null; alt: string }) {
  return (
    <Tooltip>
      <TooltipTrigger>
        {src ? (
          <Image
            src={src}
            alt={alt}
            width={24}
            height={24}
            className="object-cover rounded-sm w-6 h-6 bg-gray-200"
          />
        ) : (
          <div className="w-6 h-6 bg-gray-200 rounded-sm flex items-center justify-center text-gray-400">
            <ImageIcon size={14} />
          </div>
        )}
      </TooltipTrigger>
      <TooltipContent>
        {src ? (
          <Image src={src} alt={alt} width={150} height={150} className="object-cover rounded-md" />
        ) : (
          <p>No thumbnail</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
