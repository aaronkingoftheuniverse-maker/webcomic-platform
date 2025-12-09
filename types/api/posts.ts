import { z } from "zod";
import { BreadcrumbItem } from "@/components/ui/Breadcrumbs";

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
  postNumber: number;
  title: string;
  slug: string;
  description: string | null;
  episodeId: number;
  publishedAt: string | null;
  images: ImageDTO[];
  thumbnailImage: ImageDTO | null;
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

export interface FetchPostsResponse {
  posts: PostListItemDTO[];
}

export interface FetchPostResponse {
  post: PostDTO;
  breadcrumbs: BreadcrumbItem[];
}

export const createPostSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  episodeId: z.number().int().positive(),
  publishedAt: z.string().datetime({ offset: true }).nullable().optional(),
});

export const updatePostSchema = createPostSchema.partial();