// /lib/api.ts
export async function apiFetch<T = any>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { ...init, cache: "no-store" });
  // try to parse JSON - helpful for typed endpoints
  const text = await res.text();
  try {
    const json = text ? JSON.parse(text) : {};
    return json as T;
  } catch (e) {
    // if not JSON, throw with status
    throw new Error(`apiFetch: invalid json from ${String(input)} - ${text}`);
  }
}

/**
 * Simple typed clients (examples) — you can expand these as needed.
 * These use the types exported from /types/api/*
 */
import type {
  FetchComicsResponse,
  CreateComicRequest,
  CreateComicResponse,
} from "@/types/api/comics";
import type {
  CreatePostRequest,
  CreatePostResponse,
  FetchPostsResponse,
} from "@/types/api/posts";
import type { UploadResponse } from "@/types/api/uploads";

export const api = {
  comics: {
    list: () => apiFetch<FetchComicsResponse>("/api/creator/comics"),
    get: (id: number) => apiFetch<{ comic: any }>(`/api/creator/comics/${id}`),
    create: (payload: CreateComicRequest) => apiFetch<CreateComicResponse>("/api/creator/comics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
    update: (id: number, payload: any) =>
      apiFetch<any>(`/api/creator/comics/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    remove: (id: number) =>
      apiFetch<any>(`/api/creator/comics/${id}`, { method: "DELETE" }),
  },
  posts: {
    listForComic: (comicId: number) =>
      apiFetch<FetchPostsResponse>(`/api/creator/posts?comicId=${comicId}`),
    create: (payload: CreatePostRequest) => apiFetch<CreatePostResponse>("/api/creator/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
    get: (postId: number) => apiFetch<any>(`/api/creator/posts/${postId}`),
    update: (postId: number, payload: any) =>
      apiFetch<any>(`/api/creator/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    remove: (postId: number) => apiFetch<any>(`/api/creator/posts/${postId}`, { method: "DELETE" }),
  },
  uploads: {
    uploadForm: (fd: FormData) =>
      apiFetch<UploadResponse>("/api/creator/uploads", { method: "POST", body: fd }),
  },
};
