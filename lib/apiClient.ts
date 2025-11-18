// /lib/apiClient.ts
import type { FetchComicsResponse, CreateComicRequest, CreateComicResponse, UpdateComicRequest, UpdateComicResponse } from "@/types/api/comics";
import type { FetchPostsResponse, CreatePostRequest, CreatePostResponse, FetchPostResponse, UpdatePostRequest } from "@/types/api/posts";
import type { UploadResponse } from "@/types/api/uploads";

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const text = await res.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    throw new Error(`Invalid JSON response (${res.status})`);
  }
  if (!res.ok) {
    const errMsg = data?.error || data?.message || `Request failed (${res.status})`;
    const e = new Error(errMsg);
    (e as any).status = res.status;
    (e as any).body = data;
    throw e;
  }
  return data as T;
}

/* Comics */
export const api = {
  comics: {
    list: async (): Promise<FetchComicsResponse> => fetchJson<FetchComicsResponse>("/api/creator/comics"),
    create: async (payload: CreateComicRequest): Promise<CreateComicResponse> =>
      fetchJson<CreateComicResponse>("/api/creator/comics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      }),
    get: async (comicId: number | string) =>
      fetchJson<{ comic: any }>(`/api/creator/comics/${comicId}`),
    update: async (comicId: number | string, payload: UpdateComicRequest): Promise<UpdateComicResponse> =>
      fetchJson<UpdateComicResponse>(`/api/creator/comics/${comicId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    delete: async (comicId: number | string) =>
      fetchJson<{ ok: true }>(`/api/creator/comics/${comicId}`, { method: "DELETE" }),
  },

  posts: {
    list: async (comicId?: number | string): Promise<FetchPostsResponse> =>
      fetchJson<FetchPostsResponse>(`/api/creator/posts${comicId ? `?comicId=${comicId}` : ""}`),
    create: async (payload: CreatePostRequest): Promise<CreatePostResponse> =>
      fetchJson<CreatePostResponse>("/api/creator/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    get: async (postId: number | string): Promise<FetchPostResponse> =>
      fetchJson<FetchPostResponse>(`/api/creator/posts/${postId}`),
    update: async (postId: number | string, payload: UpdatePostRequest) =>
      fetchJson<{ post: any }>(`/api/creator/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    delete: async (postId: number | string) =>
      fetchJson<{ ok: true }>(`/api/creator/posts/${postId}`, { method: "DELETE" }),
  },

  uploads: {
    uploadFiles: async (files: File[]) => {
      const form = new FormData();
      files.forEach((f) => form.append("files", f));
      return fetchJson<UploadResponse>("/api/creator/uploads", {
        method: "POST",
        body: form,
      });
    },
  },
};

export default api;
