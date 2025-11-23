// /lib/api.ts
import apiClient from "./apiClient";

/**
 * Optional thin wrapper around apiClient
 * Only keeps convenience functions for comics/posts
 */

export const api = {
  comics: {
    list: () => apiClient.comics.list(),
    get: (slug: string | number) => apiClient.comics.get(slug),
    create: (payload: any) => apiClient.comics.create(payload),
    update: (slug: string | number, payload: any) => apiClient.comics.update(slug, payload),
    remove: (slug: string | number) => apiClient.comics.delete(slug),
  },
  posts: {
    listForComic: (comicSlug: string) => apiClient.posts.listForComic(comicSlug),
    get: (comicSlug: string, postId: number) => apiClient.posts.get(comicSlug, postId),
    create: (comicSlug: string, payload: any) => apiClient.posts.create(comicSlug, payload),
    update: (comicSlug: string, postId: number, payload: any) =>
      apiClient.posts.update(comicSlug, postId, payload),
    remove: (comicSlug: string, postId: number) =>
      apiClient.posts.delete(comicSlug, postId),
  },
  uploads: {
    uploadForm: (fd: FormData) => apiClient.uploadFiles(fd),
  },
};
