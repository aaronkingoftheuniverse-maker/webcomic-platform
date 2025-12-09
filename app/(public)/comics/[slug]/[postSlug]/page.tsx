import { notFound } from "next/navigation";
import { prisma } from "@/config/prisma";
import { PostViewer } from "@/components/comics/PostViewer";

interface PostPageProps {
  params: { slug: string; postSlug: string };
}

async function getPostData(comicSlug: string, postSlug: string) {
  // 1. Find the specific post by its slug, ensuring it's published and belongs to the correct comic.
  const currentPost = await prisma.post.findUnique({
    where: {
      slug: postSlug,
      episode: { // This is a filter on the relation
        comic: {
          slug: comicSlug,
        },
      },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      images: {
        select: { id: true, filename: true, storagePath: true },
        orderBy: { order: "asc" },
      },
      publishedAt: true, // Select for validation
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

  // 2. Now, validate the found post.
  // It must exist, belong to the correct comic, and be published.
  if (
    !currentPost ||
    currentPost.episode.comic.slug !== comicSlug ||
    !currentPost.publishedAt ||
    currentPost.publishedAt > new Date()
  ) {
    notFound();
  }

  // 3. To get next/prev links, we need the full reading order for the comic.
  const allPosts = await prisma.post.findMany({
    where: {
      episode: {
        comic: { slug: comicSlug },
      },
      publishedAt: { lte: new Date() },
    },
    orderBy: [
      { episode: { episodeNumber: "asc" } },
      { postNumber: "asc" },
    ],
    select: { slug: true },
  });

  // 4. Find the index of the current post to determine next/prev links.
  const currentIndex = allPosts.findIndex((p) => p.slug === currentPost.slug);
  const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const nextPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

  return {
    post: currentPost,
    prevPostHref: prevPost ? `/comics/${comicSlug}/${prevPost.slug}` : null,
    nextPostHref: nextPost ? `/comics/${comicSlug}/${nextPost.slug}` : null,
  };
}

export default async function PostPage({ params: paramsProp }: PostPageProps) {
  const params = await paramsProp;
  const data = await getPostData(params.slug, params.postSlug);

  return (
    <PostViewer
      title={data.post.title}
      images={data.post.images}
      prevPostHref={data.prevPostHref}
      nextPostHref={data.nextPostHref}
    />
  );
}