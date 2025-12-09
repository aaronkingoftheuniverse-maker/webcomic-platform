"use client";

import Link from "next/link";
import Image from "next/image";
import { ImageIcon } from "lucide-react";

export type ComicCardData = {
  id: number;
  title: string;
  slug: string;
  coverImage: string | null;
  description: string | null;
  episodeCount: number;
  postCount: number;
  lastPostedAt: string | null; // New field for the most recent post date
};

interface ComicCardProps {
  comic: ComicCardData;
  linkHref: string;
}

/**
 * Constructs the full URL for a stored image.
 */
function getImageUrl(relativePath: string | null | undefined): string | null {
  if (!relativePath) return null;

  const baseUrl = process.env.NEXT_PUBLIC_STORAGE_BASE_URL;

  // If the base URL isn't set, just return the relative path.
  if (!baseUrl) {
    return relativePath;
  }

  // If baseUrl is a full URL, use the robust URL constructor.
  if (baseUrl.startsWith("http")) {
    return new URL(relativePath, baseUrl).href;
  }

  // Otherwise, handle as a relative path, preventing double slashes.
  return `${baseUrl.replace(/\/$/, "")}/${relativePath.replace(/^\//, "")}`;
}

export function ComicCard({ comic, linkHref }: ComicCardProps) {
  return (
    <li className="py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-shrink-0">
          {getImageUrl(comic.coverImage) ? (
            <Image
              src={getImageUrl(comic.coverImage)!}
              alt={`Cover for ${comic.title}`}
              width={80}
              height={80}
              className="object-cover rounded-md w-20 h-20 bg-gray-100"
              priority={false}
            />
          ) : (
            <div className="w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">
              <ImageIcon size={32} />
            </div>
          )}
        </div>
        <div className="flex-grow">
          <h3 className="font-semibold">{comic.title}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">
            {comic.description || "No description"}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
            <span>
              {comic.episodeCount}{" "}
              {comic.episodeCount === 1 ? "Episode" : "Episodes"}
            </span>
            <span>
              {comic.postCount} {comic.postCount === 1 ? "Post" : "Posts"}
            </span>
            {comic.lastPostedAt && (
              <span>
                Updated: {new Date(comic.lastPostedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <Link
          href={linkHref}
          className="text-blue-600 hover:underline text-sm flex-shrink-0"
        >
          View
        </Link>
      </div>
    </li>
  );
}
