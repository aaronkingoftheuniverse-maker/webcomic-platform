// /lib/dtoMappers.ts
import type { ComicDTO } from "@/types/api/comics";
import type { PostDTO, PostListItemDTO } from "@/types/api/posts";
import type { ImageDTO } from "@/types/api/images";

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
    date: post.date ? new Date(post.date).toISOString() : new Date().toISOString(),
    description: post.description ?? null,
    comicId: post.comicId,
    images: Array.isArray(post.images) ? post.images.map(mapImageToDTO) : [],
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
export function mapComicToDTO(c: any): ComicDTO {
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
    creatorProfileId: c.creatorProfileId,
    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt),
    updatedAt: c.updatedAt instanceof Date ? c.updatedAt.toISOString() : String(c.updatedAt),
    episodeCount: episodeCount,
    postCount: postCount,
  };
}
