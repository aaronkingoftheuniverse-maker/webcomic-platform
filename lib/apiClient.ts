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
  let data: any;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    throw new Error(`Invalid JSON response (${res instanceof Response ? res.status : "unknown"})`);
  }
  if (!res.ok) {
    const errMsg = data?.error || data?.message || `Request failed`;
    const e = new Error(errMsg);
    (e as any).status = res instanceof Response ? res.status : undefined;
    (e as any).body = data;
    throw e;
  }
  return data as T;
}

export const api = {
  comics: {
    list: async (): Promise<FetchComicsResponse> =>
      fetchJson<FetchComicsResponse>("/api/creator/comics"),

    create: async (payload: CreateComicRequest): Promise<CreateComicResponse> =>
      fetchJson<CreateComicResponse>("/api/creator/comics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),

    get: async (comicSlug: string | number) =>
      fetchJson<{ comic: any }>(`/api/creator/comics/${comicSlug}`),

    update: async (comicSlug: string | number, payload: UpdateComicRequest): Promise<UpdateComicResponse> =>
      fetchJson<UpdateComicResponse>(`/api/creator/comics/${comicSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),

    delete: async (comicSlug: string | number) =>
      fetchJson<{ ok: true }>(`/api/creator/comics/${comicSlug}`, { method: "DELETE" }),
  },

posts: {
  listForComic: async (comicSlug: string) => 
    fetchJson<FetchPostsResponse>(`/api/comics/${comicSlug}/posts`),

  get: async (comicSlug: string, postId: number) =>
    fetchJson<FetchPostResponse>(`/api/comics/${comicSlug}/posts/${postId}`),

  create: async (comicSlug: string, payload: CreatePostRequest) =>
    fetchJson<CreatePostResponse>(`/api/comics/${comicSlug}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  update: async (comicSlug: string, postId: number, payload: UpdatePostRequest) =>
    fetchJson<{ post: any }>(`/api/comics/${comicSlug}/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  delete: async (comicSlug: string, postId: number) =>
    fetchJson<{ ok: true }>(`/api/comics/${comicSlug}/posts/${postId}`, {
      method: "DELETE",
    }),
}


  uploads: {
    uploadFiles: async (files: File[]): Promise<UploadResponse> => {
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
