// /lib/apiClient.ts

import {
  CreateEpisodeRequest,
  CreateEpisodeResponse,
  FetchEpisodeResponse,
  UpdateEpisodeRequest,
  UpdateEpisodeResponse,
} from "@/types/api/episodes";

import {
  FetchComicsResponse,
  CreateComicRequest,
  FetchComicDetailResponse, // Import new type
  CreateComicResponse,
  UpdateComicRequest,
  UpdateComicResponse,
} from "@/types/api/comics";

import {
  FetchPostsResponse,
  CreatePostRequest,
  CreatePostResponse,
  FetchPostResponse,
  UpdatePostRequest,
  UpdatePostResponse,
} from "@/types/api/posts";

import {
  CreatorProfile,
  UpdateCreatorProfilePayload,
} from "@/types/api/creator";

import { UploadResponse } from "@/types/api/uploads";

/* -------------------------------------------------------------------------- */
/*                                  UTILITIES                                 */
/* -------------------------------------------------------------------------- */

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    cache: "no-store",
  });

  const raw = await res.text();

  let data: any = {};

  try {
    data = raw ? JSON.parse(raw) : {};
  } catch (err) {
    throw new Error(
      `Invalid JSON response (status: ${res instanceof Response ? res.status : "unknown"})`
    );
  }

  if (!res.ok) {
    const message = data?.error || data?.message || `Request failed`;
    const error: any = new Error(message);
    error.status = res.status;
    error.body = data;
    throw error;
  }

  return data as T;
}

/* -------------------------------------------------------------------------- */
/*                                   CLIENT                                   */
/* -------------------------------------------------------------------------- */

export const api = {
  /* --------------------------------- COMICS -------------------------------- */
  comics: {
    list: (): Promise<FetchComicsResponse> =>
      fetchJson("/api/creator/comics"),

    createWithJson: (
      payload: CreateComicRequest
    ): Promise<CreateComicResponse> =>
      fetchJson("/api/creator/comics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),

    createWithFormData: (payload: FormData): Promise<CreateComicResponse> =>
      fetchJson("/api/creator/comics", {
        method: "POST",
        body: payload,
      }),

    get: (comicSlug: string | number): Promise<FetchComicDetailResponse> => // Use new type
      fetchJson(`/api/creator/comics/${comicSlug}`),

    update: (
      comicSlug: string | number,
      payload: UpdateComicRequest
    ): Promise<UpdateComicResponse> =>
      fetchJson(`/api/creator/comics/${comicSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),

    updateWithFormData: (
      comicSlug: string | number,
      payload: FormData
    ): Promise<UpdateComicResponse> =>
      fetchJson(`/api/creator/comics/${comicSlug}`, {
        method: "PATCH",
        body: payload,
      }),

    delete: (comicSlug: string | number): Promise<{ ok: true }> =>
      fetchJson(`/api/creator/comics/${comicSlug}`, {
        method: "DELETE",
      }),
  },

  /* -------------------------------- EPISODES ------------------------------- */
  episodes: {
    get: (
      comicSlug: string,
      episodeId: number
    ): Promise<FetchEpisodeResponse> =>
      fetchJson(`/api/creator/comics/${comicSlug}/episodes/${episodeId}`),

    create: (
      comicSlug: string,
      payload: FormData
    ): Promise<CreateEpisodeResponse> =>
      fetchJson(`/api/creator/comics/${comicSlug}/episodes`, {
        method: "POST",
        body: payload,
      }),

    update: (
      comicSlug: string,
      episodeId: number,
      payload: UpdateEpisodeRequest
    ): Promise<UpdateEpisodeResponse> =>
      fetchJson(`/api/creator/comics/${comicSlug}/episodes/${episodeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),      
      
    updateWithFormData: (
      comicSlug: string,
      episodeId: number,
      payload: FormData
    ): Promise<UpdateEpisodeResponse> =>
      fetchJson(`/api/creator/comics/${comicSlug}/episodes/${episodeId}`, {
        method: "PATCH",
        body: payload, // FormData will set Content-Type: multipart/form-data automatically
      }),
  },

  /* ---------------------------------- POSTS -------------------------------- */
  posts: {
    listForComic: (comicSlug: string): Promise<FetchPostsResponse> =>
      fetchJson(`/api/creator/comics/${comicSlug}/posts`),

    get: (
      comicSlug: string,
      postId: number
    ): Promise<FetchPostResponse> =>
      fetchJson(`/api/creator/comics/${comicSlug}/posts/${postId}`),

    create: (
      comicSlug: string,
      payload: CreatePostRequest
    ): Promise<CreatePostResponse> =>
      fetchJson(`/api/creator/comics/${comicSlug}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),

    update: (
      comicSlug: string,
      postId: number,
      payload: UpdatePostRequest
    ): Promise<UpdatePostResponse> =>
      fetchJson(`/api/creator/comics/${comicSlug}/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),

    updateWithFormData: (
      comicSlug: string,
      postId: number,
      payload: FormData
    ): Promise<{ ok: true }> =>
      fetchJson(`/api/creator/comics/${comicSlug}/posts/${postId}`, {
        method: "PATCH",
        body: payload,
      }),

    delete: (
      comicSlug: string,
      postId: number
    ): Promise<{ ok: true }> =>
      fetchJson(`/api/creator/comics/${comicSlug}/posts/${postId}`, {
        method: "DELETE",
      }),
  },

  /* -------------------------------- UPLOADS -------------------------------- */
  uploads: {
    uploadFiles: async (files: File[]): Promise<UploadResponse> => {
      const form = new FormData();
      files.forEach((file) => form.append("files", file));

      return fetchJson("/api/creator/uploads", {
        method: "POST",
        body: form,
      });
    },
  },

  /* -------------------------------- CREATOR -------------------------------- */
  creator: {
    getProfile: (): Promise<CreatorProfile> =>
      fetchJson("/api/creator/profile"),

    saveProfile: (
      payload: FormData
    ): Promise<CreatorProfile> =>
      fetchJson("/api/creator/profile", {
        method: "POST",
        body: payload,
      }),
  },
};

export default api;
