"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ImageIcon } from "lucide-react";

// These types should align with the data fetched by your public comic API route
export type NavPost = { id: number; title: string; slug: string; thumbnailImage: { filename: string } | null };
export type NavEpisode = { id: number; title: string; thumbnailUrl: string | null; parentId: number | null; posts: NavPost[]; childEpisodes: NavEpisode[] };

interface ComicNavTreeProps {
  comicSlug: string;
  comicTitle: string;
  episodes: NavEpisode[];
  activePostSlug?: string;
}

function getImageUrl(relativePath: string | null | undefined): string | null {
  if (!relativePath) return null;
  const baseUrl = process.env.NEXT_PUBLIC_STORAGE_BASE_URL;
  if (!baseUrl) {
    return relativePath;
  }
  if (baseUrl.startsWith("http")) {
    return new URL(relativePath, baseUrl).href;
  }
  // Otherwise, handle as a relative path, preventing double slashes.
  return `${baseUrl.replace(/\/$/, "")}/${relativePath.replace(/^\//, "")}`;
}

export function ComicNavTree({ comicSlug, comicTitle, episodes, activePostSlug }: ComicNavTreeProps) {
  const params = useParams();
  // Prioritize the slug from the client-side URL parameters.
  // Fall back to the server-provided prop for the initial load of the main comic page.
  const currentActiveSlug = params.postSlug as string || activePostSlug;
  return (
    <aside className="p-4 bg-gray-100/80 rounded-lg border border-gray-200/80">
      <h3 className="font-bold mb-2 text-lg">{comicTitle}</h3>
      <TooltipProvider>
        <div className="space-y-1">
          {episodes.map((episode) => (
            <EpisodeNavItem key={episode.id} episode={episode} comicSlug={comicSlug} level={0} activePostSlug={currentActiveSlug} />
          ))}
        </div>
      </TooltipProvider>
    </aside>
  );
}

function EpisodeNavItem({ episode, comicSlug, level, activePostSlug }: { episode: NavEpisode; comicSlug: string; level: number; activePostSlug?: string }) {
  const indentation = { paddingLeft: `${level * 1}rem` };

  return (
    <div>
      <div style={indentation} className="flex items-center gap-2 py-1 rounded-md">
        <ItemThumbnail src={getImageUrl(episode.thumbnailUrl)} alt={episode.title} />
        <span className="font-semibold text-sm flex-grow">{episode.title}</span>
      </div>
      <div className="space-y-px">
        {episode.posts.map(post => (
          <PostNavItem key={post.id} post={post} comicSlug={comicSlug} level={level + 1} activePostSlug={activePostSlug} />
        ))}
        {(episode.childEpisodes || []).map(child => (
          <EpisodeNavItem key={child.id} episode={child} comicSlug={comicSlug} level={level + 1} activePostSlug={activePostSlug} />
        ))}
      </div>
    </div>
  );
}

function PostNavItem({ post, comicSlug, level, activePostSlug }: { post: NavPost; comicSlug:string; level: number; activePostSlug?: string }) {
  const isActive = activePostSlug === post.slug; // This comparison logic is now correct
  const indentation = { paddingLeft: `${level * 1}rem` };

  return (
    <Link href={`/comics/${comicSlug}/${post.slug}`} style={indentation} className={`flex items-center gap-2 py-1 px-2 rounded-md transition-colors ${isActive ? 'bg-blue-100 font-semibold text-blue-800' : 'text-gray-900 hover:bg-gray-200'}`}>
      <ItemThumbnail src={getImageUrl(post.thumbnailImage?.filename)} alt={post.title} />
      <span className="flex-grow text-sm">{post.title}</span>
    </Link>
  );
}

function ItemThumbnail({ src, alt }: { src: string | null; alt: string }) {
  return (
    <Tooltip>
      <TooltipTrigger>
        {src ? (
          <Image src={src} alt={alt} width={24} height={24} className="object-cover rounded-sm w-6 h-6 bg-gray-200" />
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