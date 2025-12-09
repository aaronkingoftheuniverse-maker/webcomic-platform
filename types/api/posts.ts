import { z } from "zod";

/**
 * Represents the public-safe data for an image.
 * This is a more generic and reusable type than the original PostImageDTO.
 */
export interface ImageDTO {
  id: number;
  filename: string;
  storagePath: string | null;
  storageProvider: string | null;
  order: number;
  createdAt: string;
}

export interface PostDTO {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  postNumber: number;
  episodeId: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  images?: ImageDTO[];
  thumbnailImage?: ImageDTO | null;
}

export interface FetchPostsResponse {
  posts: PostDTO[];
}

export interface FetchPostResponse {
  post: PostDTO;
}

/**
 * Represents a simplified Post object for list views.
 */
export interface PostListItemDTO {
  id: number;
  postNumber: number;
  title: string;
  slug: string;
  createdAt: string;
}

export interface CreatePostRequest {
  title: string;
  description?: string | null;
  episodeId: number;
  publishedAt?: string | null;
}

export interface CreatePostResponse {
  ok: true;
  post: PostDTO;
}

export interface UpdatePostRequest {
  title?: string;
  description?: string | null;
  publishedAt?: string | null;
}

export interface UpdatePostResponse {
  ok: true;
  post: PostDTO;
}

/* Zod validation */
export const createPostSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  episodeId: z.number().int().positive(),
  publishedAt: z.string().datetime({ offset: true }).nullable().optional(),
});

export const updatePostSchema = createPostSchema.partial();