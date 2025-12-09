import { CreatorInfoCard } from "@/components/creator/CreatorInfoCard";
import { ComicNavTree } from "@/components/comics/ComicNavTree";
import { getComicLayoutData } from "@/lib/data/comics";

interface ComicLayoutProps {
  children: React.ReactNode;
  params: { slug: string };
}

export default async function ComicLayout({
  children,
  params: paramsProp, // Rename to avoid shadowing
}: ComicLayoutProps) {
  // Await the params promise to get the actual values
  const params = await paramsProp;
  const comic = await getComicLayoutData(params.slug);

  return (
    <div className="container mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
      {/* Left Column: Comic Navigation */}
      <div className="lg:col-span-1 order-2 lg:order-1">
        <ComicNavTree comicSlug={params.slug} episodes={comic.episodes} />
      </div>

      {/* Middle Column: Main Content (the post viewer) */}
      <div className="lg:col-span-3 order-1 lg:order-2">{children}</div>

      {/* Right Column: Creator Info */}
      <div className="lg:col-span-1 order-3 lg:order-3">
        {/* Add a null check for creatorProfile in case of data issues */}
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
  );
}