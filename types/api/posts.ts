// /types/api/posts.ts
import { z } from "zod";
import { ImageDTO } from "./images";

export interface PostDTO {
  id: number;
  postNumber: number;
  title: string;
  slug: string;
  date: string;
  description: string | null;
  comicId: number;
  images: ImageDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface PostListItemDTO {
  id: number;
  postNumber: number;
  title: string;
  slug: string;
  createdAt: string;
}

/* Responses */
export interface FetchPostsResponse {
  posts: PostDTO[];
}

export interface FetchPostResponse {
  post: PostDTO;
}

export interface CreatePostResponse {
  ok: true;
  post: PostDTO;
}

export interface CreatePostRequest {
  comicId: number;
  title: string;
  description?: string | null;
  images?: Array<{
    filename: string;
    storagePath?: string | null;
    storageProvider?: string | null;
  }>;
}

/* Update post request */
export interface UpdatePostRequest {
  title?: string;
  description?: string | null;
  appendImages?: Array<{
    filename: string;
    storagePath?: string | null;
    storageProvider?: string | null;
  }>;
}

/* Zod schemas for server-side validation */
export const createPostSchema = z.object({
  comicId: z.number(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  images: z
    .array(
      z.object({
        filename: z.string(),
        storagePath: z.string().nullable().optional(),
        storageProvider: z.string().nullable().optional(),
      })
    )
    .optional(),
});

export const updatePostSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  appendImages: z
    .array(
      z.object({
        filename: z.string(),
        storagePath: z.string().nullable().optional(),
        storageProvider: z.string().nullable().optional(),
      })
    )
    .optional(),
});
