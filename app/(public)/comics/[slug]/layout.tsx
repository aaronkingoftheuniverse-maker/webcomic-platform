import { CreatorInfoCard } from "@/components/creator/CreatorInfoCard";
import { ComicNavTree } from "@/components/comics/ComicNavTree";
import { CreatorTabs } from "@/components/comics/CreatorTabs"; // Import CreatorTabs
import { getComicLayoutData } from "@/lib/data/comics";
import { prisma } from "@/config/prisma";

interface ComicLayoutProps {
  children: React.ReactNode;
  params: { slug: string; postSlug?: string }; // postSlug is now optional
}

export default async function ComicLayout({
  children,
  params: paramsProp, // Rename to avoid shadowing
}: ComicLayoutProps) {
  // Await the params promise to get the actual values
  const params = await paramsProp;

  const comic = await getComicLayoutData(params.slug);

  let activePostSlug = params.postSlug; // The slug from the URL, if it exists.

  // If we are on the comic's root page, there's no postSlug in the URL.
  // We need to find the latest post to determine the active slug for the nav tree.
  if (!activePostSlug) {
    const latestPost = await prisma.post.findFirst({
      where: {
        episode: { comic: { slug: params.slug } },
        publishedAt: { lte: new Date() },
      },
      orderBy: { publishedAt: "desc" },
      select: { slug: true },
    });
    if (latestPost) {
      activePostSlug = latestPost.slug;
    }
  }

  return (
    <div className="container mx-auto">
      {/* Creator Tabs now at the top */}
      {comic.creatorProfile && (
        <div className="mb-8">
          <CreatorTabs username={comic.creatorProfile.user.username} avatarUrl={comic.creatorProfile.avatarUrl} />
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column: Comic Navigation */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <ComicNavTree comicSlug={params.slug} comicTitle={comic.title} episodes={comic.episodes} activePostSlug={activePostSlug} />
        </div>
        {/* Middle Column: Main Content (the post viewer) */}
        <main className="lg:col-span-3 order-1 lg:order-2">{children}</main>
        {/* Right Column: Creator Info */}
        <div className="lg:col-span-1 order-3 lg:order-3">
          {comic.creatorProfile && (
            <CreatorInfoCard
              username={comic.creatorProfile.user.username}
              avatarUrl={comic.creatorProfile.avatarUrl}
              bio={comic.creatorProfile.bio}
              website={comic.creatorProfile.website}
            />
          )}
        </div>
      </div>
    </div>
  );
}