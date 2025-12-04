// /lib/apiClient.ts
import type {
  FetchComicsResponse,
  CreateComicRequest,
  CreateComicResponse,
  UpdateComicRequest,
  UpdateComicResponse,
} from "@/types/api/comics";
import type {
  FetchPostsResponse,
  CreatePostRequest,
  CreatePostResponse,
  FetchPostResponse,
  UpdatePostRequest,
} from "@/types/api/posts";
import type { UploadResponse } from "@/types/api/uploads";

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { ...init, cache: "no-store" });
  const text = await res.text();

  let data: any = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    throw new Error(
      `Invalid JSON response (${res instanceof Response ? res.status : "unknown"})`
    );
  }

  if (!res.ok) {
    const errMsg = data?.error || data?.message || `Request failed`;
    const e = new Error(errMsg);
    (e as any).status = res.status;
    (e as any).body = data;
    throw e;
  }

  return data as T;
}

export const api = {
  comics: {
    list: (): Promise<FetchComicsResponse> =>
      fetchJson("/api/creator/comics"),

    create: (payload: CreateComicRequest): Promise<CreateComicResponse> =>
      fetchJson("/api/creator/comics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),

    get: (comicSlug: string | number) =>
      fetchJson(`/api/creator/comics/${comicSlug}`),

    update: (comicSlug: string | number, payload: UpdateComicRequest): Promise<UpdateComicResponse> =>
      fetchJson(`/api/creator/comics/${comicSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),

    delete: (comicSlug: string | number) =>
      fetchJson(`/api/creator/comics/${comicSlug}`, {
        method: "DELETE",
      }),
  },

posts: {
  listForComic: async (comicSlug: string) => 
    fetchJson<FetchPostsResponse>(`/api/creator/comics/${comicSlug}/posts`),

  get: async (comicSlug: string, postId: number) =>
    fetchJson<FetchPostResponse>(`/api/creator/comics/${comicSlug}/posts/${postId}`),

  create: async (comicSlug: string, payload: CreatePostRequest) =>
    fetchJson<CreatePostResponse>(`/api/creator/comics/${comicSlug}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  update: async (comicSlug: string, postId: number, payload: UpdatePostRequest) =>
    fetchJson<{ post: any }>(`/api/creator/comics/${comicSlug}/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  delete: async (comicSlug: string, postId: number) =>
    fetchJson<{ ok: true }>(`/api/creator/comics/${comicSlug}/posts/${postId}`, {
      method: "DELETE",
    }),
},


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
};

export default api;
