// /lib/dtoMappers.ts
import type { PostDTO, PostListItemDTO } from "@/types/api/posts";
import { ImageDTO } from "@/types/api/posts"; // Corrected import path
import { ComicCardData } from "@/components/comics/ComicCard";

/* Image */
export function mapImageToDTO(img: any): ImageDTO {
  return {
    id: img.id,
    filename: img.filename,
    storagePath: img.storagePath ?? null,
    storageProvider: img.storageProvider ?? null,
    order: img.order,
    createdAt: img.createdAt instanceof Date ? img.createdAt.toISOString() : String(img.createdAt),
  };
}

/* Post */
export function mapPostToDTO(post: any): PostDTO {
  return {
    id: post.id,
    postNumber: post.postNumber,
    title: post.title,
    slug: post.slug,
    description: post.description ?? null,
    episodeId: post.episodeId,
    publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString() : null,
    images: Array.isArray(post.images) ? post.images.map(mapImageToDTO) : [],
    thumbnailImage: post.thumbnailImage ? mapImageToDTO(post.thumbnailImage) : null,
    createdAt: post.createdAt instanceof Date ? post.createdAt.toISOString() : String(post.createdAt),
    updatedAt: post.updatedAt instanceof Date ? post.updatedAt.toISOString() : String(post.updatedAt),
  };
}

export function mapPostToListItem(post: any): PostListItemDTO {
  return {
    id: post.id,
    postNumber: post.postNumber,
    title: post.title,
    slug: post.slug,
    createdAt: post.createdAt instanceof Date ? post.createdAt.toISOString() : String(post.createdAt),
  };
}

/* Comic */
export function mapComicToDTO(c: any): ComicCardData {
  // Calculate total posts from nested episodes if the data is available
  const postCount = Array.isArray(c.episodes)
    ? c.episodes.reduce((sum: number, episode: any) => sum + (episode._count?.posts ?? 0), 0)
    : 0;

  const episodeCount = c._count?.episodes ?? 0;

  return {
    id: c.id,
    title: c.title,
    slug: c.slug,
    description: c.description ?? null,
    coverImage: c.coverImage ?? null,
    episodeCount: episodeCount,
    postCount: postCount,
    lastPostedAt: c.lastPostedAt, // Directly map the pre-calculated date
  };
}
