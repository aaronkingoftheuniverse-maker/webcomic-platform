import { z } from "zod";
import { PostDTO } from "./posts"; // Import PostDTO
import { BreadcrumbItem } from "@/components/ui/Breadcrumbs";

export interface EpisodeDTO {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  episodeNumber: number;
  comicId: number;
  parentId: number | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  posts: PostDTO[]; // Add posts
  childEpisodes: EpisodeDTO[]; // Add recursive child episodes
}

export interface FetchEpisodeResponse {
  episode: EpisodeDTO;
  breadcrumbs: BreadcrumbItem[];
}

export interface CreateEpisodeRequest {
  title: string;
  description?: string | null;
  episodeNumber: number;
  parentId?: number | null;
  publishedAt?: string | null;
}

export interface CreateEpisodeResponse {
  ok: true;
  episode: EpisodeDTO;
}

export interface UpdateEpisodeRequest {
  title?: string;
  description?: string | null;
  episodeNumber?: number;
  publishedAt?: string | null; // Can be string (ISO date) or null
  thumbnailUrl?: string | null; // Can be string (URL) or null (for removal)
}

export interface UpdateEpisodeResponse {
  success: true;
  episode: EpisodeDTO;
}

/* Zod validation */
export const createEpisodeSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  episodeNumber: z.number().int().positive(),
  parentId: z.number().int().positive().nullable().optional(),
  publishedAt: z.string().datetime({ offset: true }).nullable().optional(),
});

export const updateEpisodeSchema = createEpisodeSchema.partial();