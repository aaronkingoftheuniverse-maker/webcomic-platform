import "server-only";
import { prisma } from "@/config/prisma";
import type { BreadcrumbItem } from "@/components/ui/Breadcrumbs";

/**
 * Fetches the breadcrumb trail for a given episode ID.
 * Traces parent episodes up to the root comic.
 * @param episodeId The ID of the starting episode.
 * @param basePath The base path for the generated URLs (e.g., '/dashboard/creator').
 * @returns An array of BreadcrumbItem objects.
 */
export async function getBreadcrumbsForEpisode(episodeId: number, basePath: string = ""): Promise<BreadcrumbItem[]> {
  const breadcrumbs: BreadcrumbItem[] = [];
  let currentEpisodeId: number | null = episodeId;

  // Iteratively fetch parent episodes until we reach the root
  while (currentEpisodeId) {
    const episode = await prisma.episode.findUnique({
      where: { id: currentEpisodeId },
      select: {
        id: true,
        title: true,
        parentId: true,
        comic: {
          select: {
            slug: true,
            title: true,
          },
        },
      },
    });

    if (!episode) break;

    // Add the current episode to the front of the breadcrumbs array
    breadcrumbs.unshift({
      label: episode.title,
      href: `${basePath}/comics/${episode.comic.slug}/episodes/${episode.id}`,
    });

    // If this is the last loop, add the root comic
    if (!episode.parentId) {
      breadcrumbs.unshift({
        label: episode.comic.title,
        href: `${basePath}/comics/${episode.comic.slug}`,
      });
    }

    currentEpisodeId = episode.parentId;
  }

  return breadcrumbs;
}

/**
 * Fetches the breadcrumb trail for a given post ID.
 * Uses `getBreadcrumbsForEpisode` to build the parent trail.
 * @param postId The ID of the starting post.
 * @param basePath The base path for the generated URLs (e.g., '/dashboard/creator').
 * @returns An array of BreadcrumbItem objects.
 */
export async function getBreadcrumbsForPost(postId: number, basePath: string = ""): Promise<BreadcrumbItem[]> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      title: true,
      episodeId: true,
      episode: {
        select: {
          comic: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
  });

  if (!post) {
    return []; // Return empty array if post not found
  }

  // Get the breadcrumbs for the parent episode
  const parentBreadcrumbs = await getBreadcrumbsForEpisode(post.episodeId, basePath);

  // Add the current post to the end of the trail
  return [
    ...parentBreadcrumbs,
    {
      label: post.title,
      href: `${basePath}/comics/${post.episode.comic.slug}/posts/${post.id}`,
    },
  ];
}
