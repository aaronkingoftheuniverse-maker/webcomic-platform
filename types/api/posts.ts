import { z } from "zod";

export interface PostImageDTO { // Export this interface
  id: number;
  filename: string;
  order: number;
}

export interface PostDTO {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  postNumber: number;
  episodeId: number;
  createdAt: string;
  updatedAt: string;
  images?: PostImageDTO[];
  thumbnailImage?: PostImageDTO | null;
}

export interface FetchPostsResponse {
  posts: PostDTO[];
}

export interface FetchPostResponse {
  post: PostDTO;
}

export interface CreatePostRequest {
  title: string;
  description?: string | null;
  episodeId: number;
}

export interface CreatePostResponse {
  ok: true;
  post: PostDTO;
}

export interface UpdatePostRequest {
  title?: string;
  description?: string | null;
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
});

export const updatePostSchema = createPostSchema.partial();