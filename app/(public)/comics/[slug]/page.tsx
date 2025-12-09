import { notFound } from "next/navigation";
import { prisma } from "@/config/prisma";
import { PostViewer } from "@/components/comics/PostViewer";

interface ComicHomePageProps {
  params: { slug: string };
}

async function getLatestPostData(comicSlug: string) {
  // 1. Find the latest published post for this comic
  const latestPost = await prisma.post.findFirst({
    where: {
      episode: {
        comic: { slug: comicSlug },
      },
      publishedAt: { lte: new Date() },
    },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      images: {
        select: { id: true, filename: true, storagePath: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!latestPost) {
    return null;
  }

  // 2. To get next/prev links, we need the full reading order
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

  // 3. Find the index of the current post to determine next/prev
  const currentIndex = allPosts.findIndex((p) => p.slug === latestPost.slug);
  const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const nextPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

  return {
    post: latestPost,
    prevPostHref: prevPost ? `/comics/${comicSlug}/${prevPost.slug}` : null,
    nextPostHref: nextPost ? `/comics/${comicSlug}/${nextPost.slug}` : null,
  };
}

export default async function ComicHomePage({ params: paramsProp }: ComicHomePageProps) {
  // Await the params promise to get the actual values
  const params = await paramsProp;
  const data = await getLatestPostData(params.slug);

  if (!data) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold">No posts published yet.</h2>
        <p className="text-gray-600">Check back soon for the first post!</p>
      </div>
    );
  }

  return (
    <PostViewer
      title={data.post.title}
      images={data.post.images}
      activePostSlug={data.post.slug} // Pass the slug of the latest post
      prevPostHref={data.prevPostHref}
      nextPostHref={data.nextPostHref}
    />
  );
}