// /types/api/comics.ts
import { z } from "zod";
import { ComicCardData } from "@/components/comics/ComicCard";
import { EpisodeDTO } from "./episodes";
import { PostDTO } from "./posts";

export interface FetchComicsResponse {
  comics: ComicCardData[];
}

/**
 * Represents the detailed structure of a single comic, including its nested content.
 * Used for the comic detail page in the creator dashboard.
 */
export interface ComicDetailDTO {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  episodes: EpisodeDTO[];
}

export interface CreateComicRequest {
  title: string;
  description?: string | null;
}

export interface CreateComicResponse {
  ok: true;
  comic: ComicCardData;
}

export interface UpdateComicRequest {
  title?: string;
  description?: string | null;
}
export interface UpdateComicResponse {
  ok: true;
  comic: ComicCardData;
}
export interface DeleteComicResponse {
  ok: true;
}

export interface FetchComicDetailResponse {
  // This should contain the comic data
  comic: ComicDetailDTO;
}

/* Zod validation */
export const createComicSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
});

export const updateComicSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
});
