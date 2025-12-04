// /types/api/comics.ts
import { z } from "zod";

export interface ComicDTO {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  creatorProfileId: number;
  createdAt: string;
  updatedAt: string;
  episodeCount: number;
  postCount: number;
}

export interface FetchComicsResponse {
  comics: ComicDTO[];
}

export interface CreateComicRequest {
  title: string;
  description?: string | null;
}

export interface CreateComicResponse {
  ok: true;
  comic: ComicDTO;
}

export interface UpdateComicRequest {
  title?: string;
  description?: string | null;
}
export interface UpdateComicResponse {
  ok: true;
  comic: ComicDTO;
}
export interface DeleteComicResponse {
  ok: true;
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
